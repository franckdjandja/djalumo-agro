// GET or POST /api/unsubscribe?token=... (POST supports one click unsubscribe, RFC 8058)
import { createUnsubscribeHandler } from '../lib/handlers.js';
export default createUnsubscribeHandler();
