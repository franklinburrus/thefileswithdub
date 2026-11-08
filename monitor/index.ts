import { runMonitorTrigger } from './trigger.mjs';

// Match the verified website/coordinator date supported by installed workerd.
export default {
  fetch() {
    return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  },
  async scheduled(event: ScheduledController, env: MonitorEnv, ctx: ExecutionContext) {
    ctx.waitUntil(runMonitorTrigger(event, env));
  },
} satisfies ExportedHandler<MonitorEnv>;
