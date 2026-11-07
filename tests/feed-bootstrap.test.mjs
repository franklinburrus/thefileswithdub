import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import ts from 'typescript';
const path = new URL('../scripts/feed-bootstrap.ts', import.meta.url);
const compiled = ts.transpileModule(existsSync(path) ? readFileSync(path, 'utf8') : '', { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const worker = (await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)).default;
const x = { version: 'x-version', broadcasts: ['2onbAgvyKWBPYg','1oKMvNPnEzDGQ'].map(id => ({id,hlsUrl:'/api/x-media?url=verified'})), health: {metadata:{state:'healthy'}} };
const youtube = { version: 'y-version', videos: [{videoId:'ysb4ulbDmZ0'}], health:{state:'healthy',lastSuccessAt:1000} };
test('private bootstrap warms and verifies both feeds before website cutover', async () => {
  assert.ok(worker);
  const calls=[];
  const env={FEED_COORDINATOR:{fetch:async input=>{const req=new Request(input);const path=new URL(req.url).pathname;calls.push([path,req.method]);return Response.json(path==='/x'?x:path==='/youtube'?youtube:{accepted:true});}}};
  const r=await worker.fetch(new Request('http://127.0.0.1:8790/bootstrap',{method:'POST',headers:{'X-Dub-Operator':'bootstrap'}}),env);
  assert.equal(r.status,200);
  assert.equal((await r.json()).ready,true);
  assert.deepEqual(calls.slice(0,3),[['/refresh/metadata','POST'],['/refresh/youtube','POST'],['/refresh/playback','POST']]);
});
test('bootstrap refuses external hosts and incomplete feed warming', async()=>{
  assert.ok(worker);
  let calls=0;
  const env={FEED_COORDINATOR:{fetch:async()=>{calls++;return Response.json({accepted:false});}}};
  assert.equal((await worker.fetch(new Request('https://public.example/bootstrap',{method:'POST',headers:{'X-Dub-Operator':'bootstrap'}}),env)).status,403);
  assert.equal(calls,0);
  assert.equal((await worker.fetch(new Request('http://localhost/bootstrap',{method:'POST',headers:{'X-Dub-Operator':'bootstrap'}}),env)).status,502);
});

test('loopback bootstrap rejects cross-origin browser requests', async () => {
  let calls=0;
  const env={FEED_COORDINATOR:{fetch:async()=>{calls++;return Response.json({accepted:true});}}};
  const r=await worker.fetch(new Request('http://127.0.0.1:8790/bootstrap',{method:'POST',headers:{Origin:'https://untrusted.example'}}),env);
  assert.equal(r.status,403);
  assert.equal(calls,0);
});
