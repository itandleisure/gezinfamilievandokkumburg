// Pushmeldingen aan- en uitzetten op deze telefoon. Het versturen doet de edge function gezond-push in Supabase.
import { SUPABASE_URL } from './config.js';
const FN = SUPABASE_URL + '/functions/v1/gezond-push';
const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export function registerSW() { if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); }

// 'unsupported-ios' | 'unsupported' | 'denied' | 'on' | 'off'
export async function pushState() {
  if (!supported()) return isIOS && !standalone() ? 'unsupported-ios' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && await reg.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

export async function enablePush(sb, owner) {
  // Eerst de toestemming vragen, direct na de tik (iPhone wil dat)
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, msg: perm === 'denied' ? 'Meldingen zijn geweigerd.' : 'Geen toestemming gegeven.' };
  const reg = await navigator.serviceWorker.register('sw.js');
  await navigator.serviceWorker.ready;
  const res = await fetch(FN + '?action=key');
  if (!res.ok) return { ok: false, msg: 'De meldingsdienst is nog niet klaar.' };
  const { key } = await res.json();
  let sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
  sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
  const j = sub.toJSON();
  const { error } = await sb.from('push_subscriptions').upsert({ endpoint: j.endpoint, owner, p256dh: j.keys.p256dh, auth: j.keys.auth });
  if (error) return { ok: false, msg: 'Opslaan mislukt: ' + error.message };
  return { ok: true };
}

export async function disablePush(sb) {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && await reg.pushManager.getSubscription();
  if (sub) { await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe(); }
}

export async function testPush(action = 'test') {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && await reg.pushManager.getSubscription();
  if (!sub) return false;
  const r = await fetch(FN + '?action=' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
  return r.ok && (await r.json()).ok;
}
