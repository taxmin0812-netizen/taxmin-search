/* 첫 그림 전에 붙이는 표시(머리 안에서 바로 실행 — 깜빡임·밀림 방지).
   js-rv: 등장 움직임 준비. tm.js 와 같은 조건(움직임 줄이기·검색 로봇·?norv 면 안 붙임).
          tm.js 가 6초 안에 뜨지 않으면 떼어서 글이 숨은 채 남지 않게 한다.
   tm-off: 상담 시간(평일 10:00–17:30, 한국 시간) 밖 — '평일 오전 10시부터 답해 드려요' 한 줄을 보인다. */
(function () {
  'use strict';
  var r = document.documentElement;
  try {
    var k = new Date(Date.now() + 9 * 36e5), d = k.getUTCDay(), m = k.getUTCHours() * 60 + k.getUTCMinutes();
    if (!(d >= 1 && d <= 5 && m >= 600 && m < 1050)) r.classList.add('tm-off');
  } catch (x) {}
  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var bot = /bot|crawl|spider|Yeti|AdsBot|HeadlessChrome/i.test(navigator.userAgent) || /[?&]norv\b/.test(location.search);
  if (calm || bot || !('IntersectionObserver' in window)) return;
  r.classList.add('js-rv');
  setTimeout(function () { if (!window.TM_ON) r.classList.remove('js-rv'); }, 6000);
})();
