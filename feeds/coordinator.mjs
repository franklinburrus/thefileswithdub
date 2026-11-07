const CRON_LANES = { '1-59/10 * * * *': ['x', 'metadata'], '*/5 * * * *': ['youtube', 'youtube'] };

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function coordinatorFetch(request, env) {
  const path = new URL(request.url).pathname;
  if (path === '/x' || path === '/youtube') {
    if (request.method !== 'GET') return json({ error: 'method-not-allowed' }, 405);
    return json(await env.FEED_STORE.getByName(path.slice(1)).read(path.slice(1)));
  }
  if (path === '/health') {
    if (request.method !== 'GET') return json({ error: 'method-not-allowed' }, 405);
    const [x, youtube] = await Promise.all(['x', 'youtube'].map(name => env.FEED_STORE.getByName(name).read(name)));
    const healthy = [x.health.metadata, x.health.playback, youtube.health].every(lane => lane?.state === 'healthy');
    return json({ status: healthy ? 'healthy' : 'degraded', x: x.health, youtube: youtube.health });
  }
  const manualLane = { '/refresh/metadata': ['x', 'metadata'], '/refresh/playback': ['x', 'playback'], '/refresh/youtube': ['youtube', 'youtube'] }[path];
  if (manualLane) {
    if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405);
    const [feed, lane] = manualLane;
    return json(await env.FEED_STORE.getByName(feed).refresh(feed, lane));
  }
  return json({ error: 'not-found' }, 404);
}

export async function coordinatorScheduled(event, env) {
  if (env.FEED_REFRESH_ENABLED !== 'true') return;
  const route = CRON_LANES[event.cron];
  if (!route) throw new Error('unknown-feed-cron');
  const [feed, lane] = route;
  const result = await env.FEED_STORE.getByName(feed).refresh(feed, lane);
  console.log(JSON.stringify({ event: 'feed-refresh', feed, lane, ...result }));
}
