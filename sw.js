/* Kim's Ramyun PWA 서비스워커
   v3 (2026-08-03) — 중요 수정
   이전 버전은 e.request.destination==='' 을 HTML로 간주해 요청을 new Request(url)로 다시 만들었다.
   fetch()/XHR 요청의 destination 은 '' 이므로 Supabase API 호출까지 재생성 대상이 되었고,
   그 과정에서 apikey / Authorization 헤더가 통째로 사라져 모든 API가
   401 UNAUTHORIZED_MISSING_API_KEY 로 실패했다. 그 결과 시리즈·제품 목록이 빈 것처럼 보였다.
   → 교차 출처(다른 도메인) 요청에는 서비스워커가 아예 개입하지 않고,
     요청 재생성은 실제 페이지 내비게이션에만 적용한다. */
const CACHE = 'kims-margin-v3';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const orig = e.request;
  if (orig.method !== 'GET') return;

  let url;
  try { url = new URL(orig.url); } catch (err) { return; }

  /* 교차 출처(Supabase API, CDN 등)는 건드리지 않는다 — 헤더 유실 방지 */
  if (url.origin !== self.location.origin) return;

  /* 요청 재생성은 진짜 내비게이션에만. destination==='' (fetch/XHR)은 제외 */
  const isNav = orig.mode === 'navigate' || orig.destination === 'document';
  const req = isNav ? new Request(orig.url, { cache: 'reload', credentials: 'same-origin' }) : orig;

  e.respondWith(
    fetch(req).then(r => {
      if (r && r.ok && r.type === 'basic') {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put(orig, cp)).catch(() => {});
      }
      return r;
    }).catch(() => caches.match(orig))
  );
});
