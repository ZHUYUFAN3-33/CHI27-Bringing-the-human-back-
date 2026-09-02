/* Study 1's transport: the shared implementation in /net-core.js, keyed to
   Study 1's queue and token. The named exports are what public/survey.js has
   always imported; Study 2 builds its own instance from the core and never
   loads this file, so its page does not also drain Study 1's queue. */

import { createNet } from "/net-core.js";

const net = createNet({ queueKey: "study1.queue.v1", tokenKey: "study1.token.v1" });

export const { store, post, enqueue, flush, clearQueue, onStatus, pendingCount, beaconFlush } = net;
