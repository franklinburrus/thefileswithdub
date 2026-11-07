#!/usr/bin/env node
/** Build and verify the explicitly selected environment before any upload. */
import { readFileSync, readdirSync, cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join, relative, isAbsolute } from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ACCOUNT = 'ea7a77735549fff1fba3e54e742e6e7b';
const ORIGINAL_KV = 'b6d04834005e47f09602c7a671915747';
const TARGETS = {
  preview: { worker: 'thefileswithdub-preview', service: 'thefileswithdub-feeds-preview' },
  production: { worker: 'thefileswithdub', service: 'thefileswithdub-feeds' },
};

export function assertWebsiteTarget(config, environment) {
  const target = TARGETS[environment];
  if (!target || config.name !== target.worker || config.account_id !== ACCOUNT) throw new Error('Generated deployment target does not match the selected worker/account');
  const services = config.services ?? [];
  if (services.length !== 1 || services[0].binding !== 'FEED_COORDINATOR' || services[0].service !== target.service) throw new Error('Incorrect feed service binding');
  if (config.durable_objects?.bindings?.length || config.migrations?.length || Object.values(config.exports ?? {}).some(value => value?.type === 'durable-object')) throw new Error('Website worker must remain separate from coordinator storage migrations');
  const kv = config.kv_namespaces ?? [];
  const routes = config.routes ?? [];
  if (environment === 'preview') {
    if (kv.length || routes.length || config.workers_dev !== true) throw new Error('Preview must use isolated bindings and its preview URL');
  } else {
    if (kv.length !== 1 || kv[0].binding !== 'BROADCASTS_KV' || kv[0].id !== ORIGINAL_KV) throw new Error('Production requires the original KV binding');
    if (routes.length !== 1 || routes[0].pattern !== 'www.thefileswithdub.com/*' || config.workers_dev !== false) throw new Error('Production route does not match the approved target');
  }
  return target.worker;
}

export function assertReleaseGates(receipt, environment, candidateCommit) {
  if (environment !== 'production') return;
  const native = receipt?.nativeMobileAcceptance ?? receipt?.playback?.nativeMobile;
  if (native?.status !== 'PASS') throw new Error('Production upload requires a passed native-mobile acceptance record');
  if (!candidateCommit || native.candidateCommit !== candidateCommit) throw new Error('Native-mobile acceptance does not match this candidate');
  if (!native.previewWebsiteVersion || !native.device || !native.browser) throw new Error('Native-mobile acceptance requires preview version, device and browser evidence');
}

function treeDigest(directory) {
  const hash = createHash('sha256');
  function visit(current) {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Deployment artifacts must not contain symbolic links');
      if (entry.isDirectory()) visit(path);
      else hash.update(relative(directory, path)).update('\0').update(readFileSync(path)).update('\0');
    }
  }
  visit(directory);
  return hash.digest('hex');
}

export function freezeWebsiteArtifact(dist, artifactDirectory) {
  const before = treeDigest(dist);
  mkdirSync(artifactDirectory, { recursive: true });
  const snapshot = join(mkdtempSync(join(artifactDirectory, 'candidate-')), 'dist');
  cpSync(dist, snapshot, { recursive: true });
  if (treeDigest(dist) !== before || treeDigest(snapshot) !== before) throw new Error('Generated dist changed during deployment preparation');
  const configPath = join(snapshot, 'server/wrangler.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  function freezePath(value) {
    const path = resolve(dist, 'server', value);
    const inside = relative(dist, path);
    if (inside.startsWith('..') || isAbsolute(inside)) throw new Error('Deployment file path escapes the frozen artifact');
    return isAbsolute(value) ? resolve(snapshot, inside) : value;
  }
  config.main = freezePath(config.main);
  if (config.assets?.directory) config.assets.directory = freezePath(config.assets.directory);
  if (config.base_dir) config.base_dir = freezePath(config.base_dir);
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  return configPath;
}

function run(command, args, environment, capture = false) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: { ...process.env, CLOUDFLARE_ENV: environment },
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed with exit ${result.status}`);
  return result.stdout?.trim();
}

function main() {
  const args = process.argv.slice(2);
  const index = args.indexOf('--env');
  const acceptanceIndex = args.indexOf('--acceptance-receipt');
  const environment = index === -1 ? null : args[index + 1];
  const allowedPositions = new Set([index, index + 1]);
  if (acceptanceIndex >= 0) { allowedPositions.add(acceptanceIndex); allowedPositions.add(acceptanceIndex + 1); }
  if (!TARGETS[environment] || (acceptanceIndex >= 0 && !args[acceptanceIndex + 1]) || args.some((arg, i) => !allowedPositions.has(i) && arg !== '--dry-run')) throw new Error('Usage: node scripts/deploy-website.mjs --env preview|production [--dry-run] [--acceptance-receipt path]');
  const dryRun = args.includes('--dry-run');
  const commit = run('git', ['rev-parse', 'HEAD'], environment, true);
  if (!dryRun && environment === 'production') {
    if (acceptanceIndex === -1 || !args[acceptanceIndex + 1]) throw new Error('Production requires the native-mobile acceptance receipt from the existing task record');
    let receipt;
    try { receipt = JSON.parse(readFileSync(resolve(args[acceptanceIndex + 1]), 'utf8')); }
    catch { throw new Error('Native-mobile acceptance receipt must be readable JSON'); }
    assertReleaseGates(receipt, environment, commit);
  }
  if (run('git', ['status', '--porcelain'], environment, true)) throw new Error('Commit all candidate changes before deployment');
  // Verify builds with this environment, replacing any stale/default output.
  run('npm', ['run', 'verify'], environment);
  const configPath = freezeWebsiteArtifact(resolve(ROOT, 'dist'), resolve(ROOT, '.wrangler/release-artifacts'));
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const worker = assertWebsiteTarget(config, environment);
  if (run('git', ['status', '--porcelain'], environment, true) || run('git', ['rev-parse', 'HEAD'], environment, true) !== commit) throw new Error('Candidate changed during verification');
  const deployArgs = ['deploy', '--config', configPath, '--env', '', '--name', worker, '--tag', commit, '--message', `${environment} candidate ${commit}`];
  if (dryRun) deployArgs.push('--dry-run');
  run(resolve(ROOT, 'node_modules/.bin/wrangler'), deployArgs, environment);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
