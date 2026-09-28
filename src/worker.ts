import { handle } from '@astrojs/cloudflare/handler';

export { LeaderboardDO } from './durable-objects/LeaderboardDO';

export default {
  fetch: handle,
};
