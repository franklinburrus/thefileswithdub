import { DurableObject } from 'cloudflare:workers';
import { xBroadcasts } from '../app/lib/x-broadcasts';
import { FeedRepository } from '../feeds/store.mjs';
import { refreshFeed } from '../feeds/jobs.mjs';
import { coordinatorFetch, coordinatorScheduled } from '../feeds/coordinator.mjs';

interface FeedEnv {
  FEED_STORE: DurableObjectNamespace<FeedStore>;
  FEED_REFRESH_ENABLED: string;
  YOUTUBE_DATA_API_FALLBACK_ENABLED: string;
  YOUTUBE_DATA_API_KEY?: string;
}

/** Separate named objects own the X and YouTube snapshots. */
export class FeedStore extends DurableObject<FeedEnv> {
  private repository(name: string): FeedRepository {
    if ((name !== 'x' && name !== 'youtube') || !this.env.FEED_STORE.idFromName(name).equals(this.ctx.id)) throw new Error('invalid-feed-name');
    return new FeedRepository(this.ctx.storage, name, name === 'x' ? xBroadcasts : []);
  }

  async read(feed: string) {
    return this.repository(feed).read();
  }

  async refresh(feed: string, lane: 'metadata' | 'playback' | 'youtube') {
    if ((feed === 'youtube') !== (lane === 'youtube')) throw new Error('invalid-feed-lane');
    return refreshFeed(this.repository(feed), lane, this.env);
  }
}

export default {
  fetch: coordinatorFetch,
  async scheduled(event: ScheduledController, env: FeedEnv, ctx: ExecutionContext) {
    ctx.waitUntil(coordinatorScheduled(event, env));
  },
} satisfies ExportedHandler<FeedEnv>;
