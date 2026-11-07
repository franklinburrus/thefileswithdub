const CATEGORIES = new Set(['network', 'timeout', 'response-too-large', 'invalid-candidate', 'invalid-playback', 'invalid-source']);

export function errorCategory(error) {
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') return 'timeout';
  if (CATEGORIES.has(error?.message) || /^upstream-\d{3}$/.test(error?.message ?? '')) return error.message;
  return 'invalid-candidate';
}

/** The deadline covers both the fetch and streamed body consumption. */
export async function readUpstreamText(url, { fetcher = fetch, maxBytes = 1_048_576, timeoutMs = 10_000, headers = {}, allowedRedirectHosts = [] } = {}) {
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), timeoutMs);
  let reader;
  try {
    let response;
    let currentUrl = url;
    for (let redirect = 0; redirect <= 4; redirect += 1) {
      try {
        response = await fetcher(currentUrl, { signal: controller.signal, redirect: 'manual', headers });
      } catch (error) {
        throw new Error(controller.signal.aborted ? 'timeout' : 'network', { cause: error });
      }
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      await response.body?.cancel();
      const location = response.headers.get('Location');
      if (!location || redirect === 4) throw new Error('invalid-source');
      const next = new URL(location, currentUrl);
      const allowed = allowedRedirectHosts.some(host => host.startsWith('.') ? next.hostname.endsWith(host) : next.hostname === host);
      if (next.protocol !== 'https:' || next.username || next.password || next.port || !allowed) throw new Error('invalid-source');
      currentUrl = next.toString();
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`upstream-${response.status}`);
    }
    if (Number(response.headers.get('Content-Length')) > maxBytes) {
      await response.body?.cancel();
      throw new Error('response-too-large');
    }
    if (!response.body) throw new Error('invalid-candidate');
    reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let total = 0;
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      total += value.byteLength;
      if (total > maxBytes) throw new Error('response-too-large');
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    clearTimeout(deadline);
    if (reader) await reader.cancel().catch(() => {});
  }
}
