const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Keep third-party requests from holding a Worker invocation open forever.
 * The caller still decides how to present an upstream timeout to visitors.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Read a text response without allowing an upstream to consume unbounded
 * Worker memory. This is used for feeds and manifests that must be parsed.
 */
export async function readTextWithLimit(response: Response, maxBytes: number): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("Upstream response exceeded the size limit");
  }

  if (!response.body) throw new Error("Upstream response had no body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new Error("Upstream response exceeded the size limit");
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return text + decoder.decode();
  } catch (error) {
    try {
      await reader.cancel();
    } catch {
      // The stream may already be closed after a size-limit cancellation.
    }
    throw error;
  }
}

export async function readJsonWithLimit<T>(response: Response, maxBytes: number): Promise<T> {
  return JSON.parse(await readTextWithLimit(response, maxBytes)) as T;
}
