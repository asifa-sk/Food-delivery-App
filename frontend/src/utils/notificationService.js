// Simple cross-tab/route notification broadcaster using BroadcastChannel with localStorage fallback
const CHANNEL_NAME = 'orders_channel_v1';

const hasBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window;
let bc = null;
if (hasBroadcast) bc = new BroadcastChannel(CHANNEL_NAME);

const listeners = new Set();

function _emit(payload) {
  for (const cb of listeners) {
    try { cb(payload); } catch (e) { console.error(e); }
  }
}

export function sendOrderNotification(payload) {
  const data = { ...payload, ts: Date.now() };
  try {
    if (bc) bc.postMessage(data);
    // localStorage fallback to reach other tabs
    localStorage.setItem(`${CHANNEL_NAME}_last`, JSON.stringify(data));
  } catch (e) { console.error('notify', e); }
  _emit(data);
}

export function onOrderNotification(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

if (bc) {
  bc.onmessage = (ev) => _emit(ev.data);
}

// storage event fallback
window.addEventListener('storage', (ev) => {
  if (!ev.key) return;
  if (ev.key === `${CHANNEL_NAME}_last` && ev.newValue) {
    try { _emit(JSON.parse(ev.newValue)); } catch { /* ignore */ }
  }
});

export default { sendOrderNotification, onOrderNotification };
