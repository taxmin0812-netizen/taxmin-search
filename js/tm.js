/* 택스민 랜딩 동작: 출처 기록 · 전환 신호 · 첫 화면 시연(영상 + 3장면 자동 넘김) · 계산기 · 흐름띠 · 숫자 세기 ·
   전화 상담(페이지 안 폼) · 카톡(PC 안내) · 아래 고정 버튼.
   요금 규칙은 택스민 요금 등급표(개인사업자, 직전 연도 매출 기준)와 같다:
   기본 월 5만(직원 3명까지)·6만(4~5명) / 중간 월 7~8만 / 성실신고확인 월 12~15만 / 법인 월 10만부터 — 모두 부가세 별도.
   카톡은 쿼리 없는 채널 채팅 주소를 같은 탭에서 연다(앱 안 브라우저·구글 팝업 규정). PC 는 카카오 로그인이 필요해 안내 창을 먼저 보인다.
   움직임 줄이기 설정·검색 로봇·화면 캡처에서는 영상·자동 넘김·흐름띠·숫자 세기를 모두 하지 않는다(처음부터 다 보임).
   js-rv(등장 준비)·tm-off(상담 시간 밖)는 첫 그림 전에 js/early.js 가 붙인다. */
(function () {
  'use strict';
  window.TM_ON = 1;
  var doc = document, root = doc.documentElement, C = window.TM || {};
  var KAKAO = C.kakao || 'https://pf.kakao.com/_Mxojqs/chat';
  var TEL = C.tel || '0507-1445-7729';
  var ENDPOINT = C.endpoint || '';
  var PAGE = (C.pagePrefix || 'srch-') + (doc.body.getAttribute('data-page') || 'main');
  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var bot = /bot|crawl|spider|Yeti|AdsBot|HeadlessChrome/i.test(navigator.userAgent) || /[?&]norv\b/.test(location.search);
  var still = calm || bot;
  var IO = 'IntersectionObserver' in window;

  function $(s, el) { return (el || doc).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function sget(k, local) { try { return (local ? localStorage : sessionStorage).getItem(k); } catch (e) { return null; } }
  function sset(k, v, local) { try { (local ? localStorage : sessionStorage).setItem(k, v); } catch (e) {} }
  function parse(s) { try { return JSON.parse(s || 'null'); } catch (e) { return null; } }
  function isPC() { return !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches) && window.innerWidth >= 1024; }
  function onView(el, fn, opt) {
    if (!el) return;
    if (!IO) { fn(true); return; }
    new IntersectionObserver(function (es) { fn(es[0].isIntersecting); }, opt || { threshold: 0 }).observe(el);
  }

  /* ── 들어온 곳(광고·검색) 기록: 이번 방문 + 처음 들어온 곳(30일) */
  var SRC = (function () {
    var q = new URLSearchParams(location.search);
    function g(k) { return (q.get(k) || '').trim(); }
    var kw = g('n_keyword') || g('n_query') || g('utm_term');
    var label = '', key = 'direct';
    if (g('n_media') || g('n_keyword') || g('n_query') || g('n_ad')) { label = '네이버 검색광고' + (kw ? ' · 키워드 ' + kw : ''); key = 'naver_ad'; }
    else if (g('gclid') || g('gbraid') || g('wbraid')) { label = '구글 광고' + (kw ? ' · 키워드 ' + kw : ''); key = 'google_ad'; }
    else if (g('utm_source') || g('src')) {
      var s = g('utm_source') || g('src');
      label = s + (g('utm_medium') ? ' / ' + g('utm_medium') : '') + (g('utm_campaign') ? ' · ' + g('utm_campaign') : '');
      key = s;
    } else {
      var host = '';
      try { host = doc.referrer ? new URL(doc.referrer).hostname : ''; } catch (e) {}
      var map = [[/naver\./, '네이버 검색', 'naver'], [/google\./, '구글 검색', 'google'], [/daum\.|kakao\./, '다음·카카오', 'daum'],
        [/daangn|karrot/, '당근', 'daangn'], [/instagram|facebook/, '인스타그램', 'instagram'], [/youtube/, '유튜브', 'youtube']];
      for (var i = 0; i < map.length; i++) { if (map[i][0].test(host)) { label = map[i][1]; key = map[i][2]; break; } }
      if (!label) {
        if (host && host !== location.hostname) { label = host; key = host; }
        else { label = '직접 방문'; key = 'direct'; }
      }
    }
    var cur = { label: label, key: key, ad: g('utm_content') || g('n_ad') || '', camp: g('utm_campaign') || g('n_campaign_type') || '' };
    var prev = parse(sget('tm_src'));
    if (key === 'direct' && prev) cur = prev; else sset('tm_src', JSON.stringify(cur));
    var first = parse(sget('tm_first', 1));
    if (!first || !first.t || (Date.now() - first.t) > 30 * 864e5) { first = { label: cur.label, t: Date.now() }; sset('tm_first', JSON.stringify(first), 1); }
    cur.full = cur.label + (first.label && first.label !== cur.label ? ' (처음 들어온 곳: ' + first.label + ')' : '');
    return cur;
  })();

  /* ── 전환 신호: dataLayer · gtag · 구글 광고/네이버(tags.js) · 사무소 시트 집계 */
  function hit(e) {
    if (!ENDPOINT || C.hitBeacon === false) return;
    var body = JSON.stringify({ type: 'hit', e: e, s: SRC.key, v: SRC.ad || '-', page: PAGE });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=utf-8' }));
      else fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: body, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, keepalive: true });
    } catch (x) {}
  }
  function track(name, p) {
    p = p || {}; p.page = PAGE; p.traffic_src = SRC.key; p.ad = SRC.ad || '-';
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, p));
    try { if (typeof window.gtag === 'function') window.gtag('event', name, Object.assign({ transport_type: 'beacon' }, p)); } catch (x) {}
    try { if (typeof window.TM_CONV === 'function') window.TM_CONV(name, p); } catch (x) {}
    if (/^(kakao_click|tel_click|form_submit|calc_complete)$/.test(name)) hit(name);
  }
  if (!bot && !sget('tm_view_' + PAGE)) { sset('tm_view_' + PAGE, '1'); hit('view'); }

  /* ── 알림 띠 · 복사(성공했을 때만 '복사했어요') */
  var toastEl = $('.toast'), toastT;
  function topHost() { return doc.querySelector('dialog[open]') || doc.body; }
  function toast(msg) {
    if (!toastEl) return;
    var host = topHost();   /* 열린 팝업이 있으면 그 안으로 옮김(팝업 뒤·어두운 막 아래에 가리지 않게) — 계산 팝업은 아래 버튼 줄 바로 위에 */
    var bar = host !== doc.body && host.querySelector('.cd-acts'); if (bar) host = bar;
    if (toastEl.parentNode !== host) host.appendChild(toastEl);
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2800);
  }
  function copyText(t) {
    var ok = false;
    try {
      var host = topHost(), ta = doc.createElement('textarea');   /* 팝업이 열려 있으면 바깥은 손댈 수 없으니 팝업 안에서 복사 */
      ta.value = t; ta.setAttribute('readonly', ''); ta.className = 'hp';
      host.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
      ok = doc.execCommand('copy'); host.removeChild(ta);
    } catch (x) { ok = false; }
    return ok;
  }

  /* ── 머리줄: 내리면 떠 있는 캡슐 · 스크롤 등장 */
  var hd = $('[data-hd]');
  function onScroll() { if (hd) hd.classList.toggle('on', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (!still && IO && root.classList.contains('js-rv')) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(function (el) { io.observe(el); });
  }

  /* ── 첫 화면 시연 */
  var show = $('[data-show]');
  var paused = false, mqSet = null;   /* 멈춤 단추 상태 — 흐름띠도 함께 멈춤(WCAG 2.2.2) */
  if (show) {
    var frame = $('.show-frame', show), video = $('.show-bg', show), dev = $('.device', show);
    var scenes = $$('.scene', show), tabs = $$('[data-go]', show), caps = $$('[data-cap]', show);
    var cur = 0, t0 = 0, raf = 0, seen = false, held = false, DUR = 9000, chatT = [], cs = 0;
    /* 배경 영상: 사진을 먼저 보이고, 영상은 페이지가 다 뜬 뒤 받아서 재생되면 겹친다(데이터 절약 모드·아주 느린 회선·움직임 줄이기는 사진만) */
    var cn = navigator.connection, save = !!(cn && (cn.saveData || /2g|3g/.test(cn.effectiveType || '')));
    var playV = function () { if (!video || !video.src || paused) return; var p = video.play(); if (p && p.catch) p.catch(function () {}); };
    if (video && !still && !save) {
      var startVideo = function () {
        if (video.src) return;
        video.src = video.getAttribute('data-src');
        video.addEventListener('playing', function () {
          video.classList.add('on');
          /* 영상이 늦게 시작되면(휴대폰) 대화가 이미 흐른 만큼 영상을 앞으로 맞춤 — 사장님 동작과 말풍선이 어긋나지 않게 */
          if (cur === 0 && cs) { var el = (performance.now() - cs) / 1000; if (el > 0.3 && el < 8) { try { video.currentTime = el; } catch (x) {} } }
        }, { once: true });
        playV();
      };
      if (doc.readyState === 'complete') setTimeout(startVideo, 300); else window.addEventListener('load', function () { setTimeout(startVideo, 300); });
      onView(frame, function (v) { if (!video.src) return; if (v) playV(); else video.pause(); });
    }
    var chatPlay = function (sc) {
      chatT.forEach(clearTimeout); chatT = []; cs = performance.now();
      /* 배경 영상의 사장님 동작에 맞춤: 0~1.5초 입력하고 보냄 → 내 말풍선, 고개 들고 미소 → 세무사 답 */
      var bubs = $$('.bub', sc), typ = $('.typing', sc), t = 1300;
      bubs.forEach(function (b) { b.classList.remove('in'); });
      if (typ) typ.classList.remove('on');
      bubs.forEach(function (b) {
        var us = b.classList.contains('us');
        if (us && typ) { chatT.push(setTimeout(function () { sc.insertBefore(typ, b); typ.classList.add('on'); }, t)); t += 900; }
        chatT.push(setTimeout(function () { if (typ) typ.classList.remove('on'); b.classList.add('in'); }, t));
        t += us ? 700 : 650;
      });
    };
    /* 키보드 초점이 시연 안에 있으면 자동 넘김을 멈춘다(마우스로 누른 초점은 빼고) */
    var kbIn = function () { var a = doc.activeElement; try { return !!(a && show.contains(a) && a.matches(':focus-visible')); } catch (x) { return false; } };
    var scr = $('.screen', show), cuT = 0;
    /* 보고서 장면: 금액이 0 에서 올라감(예시 금액) */
    var countUp = function (el) {
      var to = +el.getAttribute('data-to'), suf = el.getAttribute('data-suf') || '', c0 = performance.now();
      if (!to) return;
      el.textContent = '0' + suf;
      (function st(now) {
        var p = Math.min(1, (now - c0) / 1100), k = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * k).toLocaleString('ko-KR') + suf;
        if (p < 1) requestAnimationFrame(st);
      })(c0);
    };
    var go = function (i, user) {
      var prev = cur, back = i < cur && !(cur === scenes.length - 1 && i === scenes.length);
      cur = (i + scenes.length) % scenes.length;
      if (scr) scr.classList.toggle('back', !!back);
      if (frame) frame.setAttribute('data-cur', String(cur));
      scenes.forEach(function (s, k) {
        s.classList.remove('out');
        if (k === prev && prev !== cur) { s.classList.remove('on'); s.classList.add('out'); }
        else if (k !== cur) s.classList.remove('on');
        if (k === cur) { s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); }
      });
      tabs.forEach(function (b, k) { b.setAttribute('aria-pressed', k === cur ? 'true' : 'false'); b.style.removeProperty('--p'); });
      caps.forEach(function (c, k) { c.hidden = k !== cur; });
      clearTimeout(cuT);
      var rvEl = !still && $('.report .v[data-to]', scenes[cur]);
      if (rvEl) cuT = setTimeout(function () { countUp(rvEl); }, 450);
      if (!still && $('.bub', scenes[cur])) { chatPlay(scenes[cur]); if (video && video.src) { try { video.currentTime = 0; } catch (x) {} } }
      t0 = performance.now();
      if (user) held = paused || kbIn();   /* 멈춘 채 탭·밀기를 해도 멈춤은 그대로 */
    };
    var tick = function (now) {
      raf = 0;
      if (!seen || held || paused || still) return;
      var p = Math.min(1, (now - t0) / DUR);
      if (tabs[cur]) tabs[cur].style.setProperty('--p', p.toFixed(3));
      if (p >= 1) go(cur + 1);
      raf = requestAnimationFrame(tick);
    };
    var run = function () { if (!raf && !still && !paused) raf = requestAnimationFrame(tick); };
    if (frame) frame.setAttribute('data-cur', '0');
    tabs.forEach(function (b, k) { b.addEventListener('click', function () { go(k, true); track('show_tab', { tab: k }); }); });
    /* 멈춤 단추(자동 넘김·배경 영상·흐름띠 멈춤, WCAG 2.2.2) — 이름은 그대로 두고 눌림 상태(aria-pressed)만 바꾼다 */
    var pz = $('[data-pause]', show);
    if (pz) pz.addEventListener('click', function () {
      paused = !paused; held = paused; pz.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (video && video.src) { if (paused) video.pause(); else playV(); }
      if (mqSet) mqSet();
      if (!paused) { t0 = performance.now(); run(); }
    });
    /* 시연 휴대폰을 톡 누르면: 카톡 장면일 때 카톡 상담 */
    if (dev) dev.addEventListener('click', function () {
      if (cur === 0) { var k = $('.hero [data-kakao="hero"]'); if (k) k.click(); }
    });
    /* 손가락으로 밀어 넘기기(화살표 대신) */
    var tx = null, ty = null;
    frame.addEventListener('touchstart', function (ev) { var t = ev.touches[0]; tx = t.clientX; ty = t.clientY; }, { passive: true });
    frame.addEventListener('touchend', function (ev) {
      if (tx === null) return;
      var t = ev.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty; tx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { go(cur + (dx < 0 ? 1 : -1), true); track('show_swipe', {}); }
    }, { passive: true });
    if (!still) {
      frame.classList.add('play');
      show.addEventListener('mouseenter', function () { held = true; });
      show.addEventListener('mouseleave', function () { if (paused || kbIn()) return; held = false; t0 = performance.now(); run(); });
      show.addEventListener('focusin', function () { if (kbIn()) held = true; });
      show.addEventListener('focusout', function (ev) { if (paused || show.contains(ev.relatedTarget)) return; held = false; t0 = performance.now(); run(); });
      onView(show, function (v) { seen = v; if (v) { if (!t0) go(0); else t0 = performance.now(); if (!paused) run(); } }, { threshold: 0.35 });
    }
  }

  /* ── 첫 화면 그림: 480×380 캔버스를 틀 폭에 맞춰 키우거나 줄임(휴대폰·PC 같은 구도) */
  var illF = $('.show-frame.ill');
  if (illF) {
    var fitIll = function () { var w = illF.clientWidth || 358; illF.style.setProperty('--k', Math.max(.6, Math.min(1.32, w / 480)).toFixed(4)); };
    fitIll(); window.addEventListener('resize', fitIll, { passive: true });
  }

  /* ── 첫 화면 그림(사진 + 카드): 1024×650 판을 틀 폭에 맞춤 */
  var hcF = $('.hc-frame');
  if (hcF) { var fitHc = function () { hcF.style.setProperty('--k', ((hcF.clientWidth || 358) / 1024).toFixed(4)); }; fitHc(); window.addEventListener('resize', fitHc, { passive: true }); }

  /* ── 업종 사진: 단추 없이 3.2초마다 한 장씩 자동으로 넘김(끝이면 처음으로) · 손가락·마우스를 대면 잠시 멈춤 · 화면 밖·움직임 줄이기면 안 움직임 */
  var indA = $('[data-inds]');
  if (indA && !still && IO) {
    var aVis = false, aHold = false, aT = null;
    onView(indA, function (v) { aVis = v; });
    setInterval(function () {
      if (!aVis || aHold || doc.hidden) return;
      var c0 = $('.ind-card', indA), gap = parseFloat(getComputedStyle(indA).columnGap) || 16;
      var stepW = c0 ? c0.getBoundingClientRect().width + gap : 320;
      var end = indA.scrollLeft + indA.clientWidth >= indA.scrollWidth - 8;
      indA.scrollTo({ left: end ? 0 : indA.scrollLeft + stepW, behavior: 'smooth' });
    }, 3200);
    var aStop = function () { aHold = true; clearTimeout(aT); };
    var aGo = function () { clearTimeout(aT); aT = setTimeout(function () { aHold = false; }, 5000); };
    ['pointerdown', 'mouseenter', 'focusin'].forEach(function (n) { indA.addEventListener(n, aStop); });
    ['pointerup', 'mouseleave', 'focusout'].forEach(function (n) { indA.addEventListener(n, aGo); });
    indA.addEventListener('touchstart', aStop, { passive: true }); indA.addEventListener('touchend', aGo, { passive: true });
  }

  /* ── 업종 사진 카드: 옆으로 넘김(손가락으로 밀기 + 단추 · PC 는 제목 옆, 휴대폰은 카드 아래) */
  var indT = $('[data-inds]');
  if (indT) {
    var ipv = $$('[data-inds-prev]'), inx = $$('[data-inds-next]');
    var indStep = function (dd) { var c = $('.ind-card', indT); var w = c ? c.getBoundingClientRect().width + (parseFloat(getComputedStyle(indT).columnGap) || 16) : 320; indT.scrollBy({ left: dd * w, behavior: still ? 'auto' : 'smooth' }); };
    var indSync = function () { var st = indT.scrollLeft < 8, en = indT.scrollLeft + indT.clientWidth > indT.scrollWidth - 8; ipv.forEach(function (x) { x.disabled = st; }); inx.forEach(function (x) { x.disabled = en; }); };
    ipv.forEach(function (x) { x.addEventListener('click', function () { indStep(-1); track('inds_prev', {}); }); });
    inx.forEach(function (x) { x.addEventListener('click', function () { indStep(1); track('inds_next', {}); }); });
    indT.addEventListener('scroll', indSync, { passive: true }); window.addEventListener('resize', indSync); indSync();
  }

  /* ── 기장료 계산 팝업: 업종 5 · 작년 매출 3 · 직원 3 — 누를 때마다 바로 계산(11/4 대표님: 한눈에, 선택지 적게)
     요금 규칙: 업종군 A 도소매(9억/15억) · B 음식·제조·건설·IT(5억/7.5억) · C 서비스·프리랜서(3억/5억) · X 법인 */
  var KK = '<span class="kk"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6c-5 0-9 3.1-9 7 0 2.5 1.7 4.7 4.2 5.9l-.9 3.5c-.1.4.4.7.7.4l4.2-2.8h.8c5 0 9-3.1 9-7s-4-7-9-7z" fill="currentColor"/></svg></span>';
  var CK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.3 4.3L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IND_G = { food: 'B', retail: 'A', svc: 'C', mfg: 'B', corp: 'X' };
  var IND_NAME = { food: '음식점·카페', retail: '도소매·쇼핑몰', svc: '서비스·프리랜서', mfg: '제조·건설·IT', corp: '법인' };
  var EMP_NAME = { '3': '0~3명', '5': '4~5명', '6': '6명 이상' };
  var BAND = { A: { lo: '9억원', hi: '15억원', loS: '9억', hiS: '15억' }, B: { lo: '5억원', hi: '7억 5천만원', loS: '5억', hiS: '7.5억' }, C: { lo: '3억원', hi: '5억원', loS: '3억', hiS: '5억' } };
  var LAST = null, calcSent = false, calcStarted = false;
  var cdlg = $('#calc-dlg');
  function inclLine(R) {
    if (R.won.length === 2) return '부가세 포함 월 ' + won(R.won[0] * 1.1) + ' ~ ' + won(R.won[1] * 1.1);
    return '부가세 포함 월 ' + won(R.won[0] * 1.1) + (R.from ? '부터' : '');
  }
  if (cdlg) {
    var S = { ind: null, rev: 'lo', emp: '3' };   /* 기본값: 업종 한 번이면 결과 완성 */
    var cres = $('[data-cd-res]', cdlg);
    var grp = function (k) { return $('[data-k="' + k + '"]', cdlg); };
    var revText = function (g, v) { var bb = BAND[g]; return v === 'lo' ? bb.lo + ' 이하' : v === 'mid' ? bb.lo + ' 초과 ~ ' + bb.hi + ' 미만' : bb.hi + ' 이상'; };
    var revLabels = function (g) {
      var bb = BAND[g];
      $$('button', grp('rev')).forEach(function (x) {
        var v = x.getAttribute('data-v');
        x.textContent = v === 'lo' ? bb.loS + ' 이하' : v === 'mid' ? bb.loS + '~' + bb.hiS : bb.hiS + ' 이상';
        x.disabled = false;
      });
    };
    var compute = function () {
      var g = IND_G[S.ind];
      var R = { ind: IND_NAME[S.ind] || '-', rev: '-', emp: '-', tier: '', price: '월 5만원부터', won: [50000], why: '', from: true, corp: false, done: false };
      if (!S.ind) return R;
      if (g === 'X') { R.corp = true; R.tier = '법인'; R.price = '월 10만원부터'; R.won = [100000]; R.why = '법인은 장부 상태와 거래량을 보고 상담 때 확정해요.'; R.done = true; return R; }
      var bb = BAND[g];
      if (S.rev) R.rev = revText(g, S.rev);
      if (S.emp) R.emp = EMP_NAME[S.emp];
      var t = S.rev === 'mid' ? 'P' : S.rev === 'hi' ? 'S' : 'L';
      if (t === 'L' && S.emp === '6') { t = 'P'; R.why = '4대보험 직원이 6명 이상이면 중간 구간이에요.'; }
      R.from = !(S.rev && S.emp);
      if (t === 'L') { R.tier = '기본 구간'; if (S.emp === '5') { R.price = '월 6만원'; R.won = [60000]; } else { R.price = R.from ? '월 5만원부터' : '월 5만원'; R.won = [50000]; } }
      else if (t === 'P') { R.tier = '중간 구간'; R.price = '월 7~8만원'; R.won = [70000, 80000]; if (!R.why) R.why = '작년 매출이 ' + bb.lo + '을 넘으면 중간 구간이에요.'; }
      else { R.tier = '성실신고확인 구간'; R.price = '월 12~15만원'; R.won = [120000, 150000]; R.why = '작년 매출이 ' + bb.hi + ' 이상이면 성실신고확인 대상이라 이 구간이에요.'; }
      /* 중간·성실 구간의 직원 수 상한은 아직 정하지 않음 → 6명 이상이면 상담 때 확정(규정 검수 11/4) */
      if (S.emp === '6') {
        R.why = (R.why ? R.why + ' ' : '') + '직원이 많으면 인원에 따라 상담 때 확정해요.';
        /* 닫힌 범위(월 7~8만원)가 상한처럼 읽히지 않게 '부터'로(규정 검수 11/4 1회째) */
        R.price = t === 'S' ? '월 12만원부터' : '월 7만원부터'; R.won = [t === 'S' ? 120000 : 70000]; R.from = true;
      }
      R.done = !!(S.rev && S.emp);
      return R;
    };
    var renderCalc = function () {
      var R = compute();
      var hint = !S.ind ? '업종부터 골라 주세요.' : R.corp ? '' : !S.rev ? '작년 매출을 고르면 더 정확해져요.' : !S.emp ? '직원 수를 고르면 확정돼요.' : '';
      var g0 = IND_G[S.ind], bb0 = BAND[g0];
      var base = !S.ind ? '' : R.corp ? '법인 · 장부 상태와 거래량을 보고 확정' : R.ind + ' · 작년 매출 ' + R.rev + ' · 4대보험 직원 ' + R.emp;
      var chg = (S.ind && !R.corp && S.rev === 'lo' && S.emp === '3' && bb0) ? '작년 매출이 ' + bb0.lo + '을 넘거나 직원이 4명 이상이면 달라져요' : '';
      cres.innerHTML = '<p class="lbl">예상 기장료' + (R.tier ? ' · ' + esc(R.tier) : '') + '</p>' +
        '<p class="price num">' + esc(R.price) + '<small>부가세 별도</small></p>' +
        (S.ind ? '<p class="incl num">' + inclLine(R) + '</p>' : '') +
        (R.why ? '<p class="why">' + esc(R.why) + '</p>' : '') +
        (hint ? '<p class="incl">' + hint + '</p>' : '') +
        (S.ind ? '<dl class="cd-dl"><div><dt>기준</dt><dd>' + esc(base) + '</dd></div>' +
          '<div><dt>포함</dt><dd>장부 정리 · 부가세 신고 · 직원 월급 신고 · 매달 매출 보고서</dd></div>' +
          '<div><dt>별도</dt><dd>' + (R.corp ? '법인세' : '종합소득세') + ' 신고비(1년 1번 · 신고 전에 금액 안내)</dd></div>' +
          (chg ? '<div><dt>달라지면</dt><dd>' + esc(chg) + '</dd></div>' : '') + '</dl>' : '');
      cres.classList.toggle('done', R.done);
      if (!still) { cres.classList.remove('pop'); void cres.offsetWidth; cres.classList.add('pop'); }
      /* 카톡에 붙여 넣는 글: 검색어는 넣지 않고 짧은 안내 번호만(N 네이버 광고 · G 구글 광고 · W 그 밖 - 쪽 이름) */
      LAST = S.ind ? {
        R: R,
        text: '[택스민 기장료 상담]\n업종: ' + R.ind + '\n작년 매출: ' + R.rev + '\n4대보험 직원: ' + R.emp +
          '\n예상 기장료: ' + R.price + ' (부가세 별도' + (R.tier ? ', ' + R.tier : '') + ')\n(안내 번호 ' + ({ naver_ad: 'N', google_ad: 'G' }[SRC.key] || 'W') + '-' + PAGE.replace(/^[a-z]+-/, '') + ')'
      } : null;
      /* 전화 상담 폼의 업종: 손님이 직접 고르지 않았으면 계산 결과를 따라감 */
      var f = $('[data-rsv]');
      if (f && S.ind) {
        var cur = f.querySelector('input[name=ind]:checked');
        if (!cur || cur.hasAttribute('data-auto')) {
          if (cur) cur.removeAttribute('data-auto');
          var r = f.querySelector('input[name=ind][value="' + IND_NAME[S.ind] + '"]');
          if (r) { r.checked = true; r.setAttribute('data-auto', ''); }
        }
      }
      if (R.done && !calcSent) { calcSent = true; track('calc_complete', { tier: R.tier, price: R.price }); }
    };
    cdlg.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.cd-opts button'); if (!btn || btn.disabled) return;
      var k = btn.parentNode.getAttribute('data-k'), v = btn.getAttribute('data-v');
      S[k] = v;
      $$('button', btn.parentNode).forEach(function (x) { x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'); });
      if (k === 'ind') {
        if (IND_G[v] === 'X') { ['rev', 'emp'].forEach(function (q) { S[q] = null; $$('button', grp(q)).forEach(function (x) { x.disabled = true; x.setAttribute('aria-pressed', 'false'); }); }); }
        else {
          revLabels(IND_G[v]); $$('button', grp('emp')).forEach(function (x) { x.disabled = false; });
          [['rev', 'lo'], ['emp', '3']].forEach(function (d) {
            if (S[d[0]]) return;
            S[d[0]] = d[1];
            $$('button', grp(d[0])).forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-v') === d[1] ? 'true' : 'false'); });
          });
        }
      }
      if (!calcStarted) { calcStarted = true; track('calc_start', {}); }
      renderCalc();
    });
  }

  /* ── 업종 흐름띠: 칩을 한 벌 더 붙여 끝없이 흐르게(움직임 줄이기·캡처는 멈춘 채 여러 줄) · 화면 밖이면 멈춤 */
  var marq = $('.marq');
  if (marq && !still) {
    root.classList.add('js-mq');
    var mqW = Math.max(window.innerWidth || 0, 1280);
    $$('.mtrack', marq).forEach(function (t, k) {
      var one = t.innerHTML, n = 1;
      while (t.scrollWidth < mqW && n < 8) { t.innerHTML += one; n++; }
      t.innerHTML += t.innerHTML;   /* 두 벌: -50% 이동이 끊김 없이 */
      t.style.animationDuration = Math.round(t.scrollWidth / 2 / (k ? 36 : 42)) + 's';
    });
    var mqVis = false, mqHold = false;
    /* 화면 밖·첫 화면 멈춤 단추·마우스 올림·손가락으로 누르고 있을 때는 멈춤 */
    mqSet = function () { var on = mqVis && !mqHold && !paused; $$('.mtrack', marq).forEach(function (t) { t.style.animationPlayState = on ? 'running' : 'paused'; }); };
    onView(marq, function (v) { mqVis = v; mqSet(); });
    marq.addEventListener('mouseenter', function () { mqHold = true; mqSet(); });
    marq.addEventListener('mouseleave', function () { mqHold = false; mqSet(); });
    marq.addEventListener('touchstart', function () { mqHold = true; mqSet(); }, { passive: true });
    marq.addEventListener('touchend', function () { mqHold = false; mqSet(); }, { passive: true });
  }

  /* ── 카드 모션그래픽(Higgsfield 영상): 보일 때 처음부터 한 번 재생, 화면 밖이면 멈춤(움직임 줄이기·캡처는 첫 장면 그림) */
  if (!still && IO) {
    $$('video.fv').forEach(function (v) {
      /* 끝나면 data-rest 장면(영수증: 빛줄기·체크가 함께 보이는 3초)이나 마지막 장면에서 멈춤(되풀이 재생 없음) */
      v.addEventListener('ended', function () { var r = v.getAttribute('data-rest'); if (r) { try { v.currentTime = +r; } catch (x) {} } });
      onView(v, function (on) {
        if (on) {
          if (!v.src) v.src = v.getAttribute('data-src');
          try { v.currentTime = 0; } catch (x) {}
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        } else if (v.src) v.pause();
      }, { threshold: 0.5 });
    });
  }

  /* ── 숫자 세기(마무리 카드의 누적 고객만 — 가격은 세지 않음): 보이기 시작할 때 한 번. 그 전에는 늘 진짜 값이 보임 */
  var stats = $('[data-stats]');
  if (stats && !still && IO) {
    var ems = $$('[data-count]', stats), done = false;
    onView(stats, function (v) {
      if (!v || done) return; done = true;
      ems.forEach(function (el) { el.textContent = '0'; });
      var t0 = performance.now();
      (function step(now) {
        var p = Math.min(1, (now - t0) / 1200), k = 1 - Math.pow(1 - p, 3);
        ems.forEach(function (el) { el.textContent = Math.round(+el.getAttribute('data-count') * k).toLocaleString('ko-KR'); });
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.15 });
  }

  /* ── PC 카톡 안내 창 */
  var pcDlg = $('#kk-pc'), rsvDlg = $('#rsv-dlg');
  function openDlg(d) { if (!d) return; if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', ''); }
  function closeDlg(d) { if (!d) return; if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); }
  [pcDlg, cdlg, rsvDlg].forEach(function (d) { if (d) d.addEventListener('click', function (ev) { if (ev.target === d || ev.target.closest('[data-close]')) closeDlg(d); }); });

  /* ── 클릭: 카톡·전화·기타 */
  doc.addEventListener('click', function (ev) {
    var oc = ev.target.closest('[data-open-calc]');
    if (oc && cdlg) {
      ev.preventDefault(); var ocD = oc.closest('dialog'); if (ocD && ocD !== cdlg) closeDlg(ocD);
      openDlg(cdlg); dockSync();
      var pre = oc.getAttribute('data-ind'), pb = pre ? $('[data-k="ind"] [data-v="' + pre + '"]', cdlg) : null;
      if (pb) pb.click();
      track('calc_open', { position: oc.getAttribute('data-open-calc') + (pre ? ':' + pre : '') }); return;
    }
    var a = ev.target.closest('[data-kakao]');
    if (a) {
      var copied = a.hasAttribute('data-copy') && LAST ? copyText(LAST.text) : false;
      track('kakao_click', { position: a.getAttribute('data-kakao'), device: isPC() ? 'pc' : 'mobile' });
      if (isPC() && pcDlg) {
        ev.preventDefault(); var inD = a.closest('dialog'); if (inD && inD !== pcDlg) closeDlg(inD);
        var pcc = $('[data-pc-copied]', pcDlg); if (pcc) pcc.hidden = !copied;   /* 복사는 PC 에 됐으니 PC 카톡에 붙여 넣으라고 */
        openDlg(pcDlg); return;
      }
      if (copied) toast('계산 결과를 복사했어요 · 카톡에 붙여 넣어 주세요');
      /* 휴대폰: 같은 탭에서 채널 채팅 주소로 이동. 복사했으면 알림을 0.8초 보여 주고, 광고 전환 태그가 켜져 있으면 신호가 나갈 틈(0.3초)을 둔다. */
      var wait = copied ? 800 : (C.gads || C.naverWa) ? 300 : 0;
      if (wait && !(ev.metaKey || ev.ctrlKey || ev.shiftKey)) {
        ev.preventDefault(); var goTo = a.href;
        setTimeout(function () { location.href = goTo; }, wait);
      }
      return;
    }
    var t = ev.target.closest('[data-tel]');
    if (t) { track('tel_click', { position: t.getAttribute('data-tel') }); return; }
    var tr = ev.target.closest('[data-track]');
    if (tr) track(tr.getAttribute('data-track'), {});
  });

  /* ── 아래 고정 버튼: 첫 화면 버튼이 안 보일 때만. 계산 결과·상담 판·마무리가 보이거나 입력 중이면 숨김 */
  var dock = $('[data-dock]'), fab = $('[data-ask]'), heroCta = $('.hero .cta'), consultEl = $('#consult'), endEl = $('.closing');
  var vis = { hero: true, consult: false, end: false }, typing = false;
  function dockSync() {
    if (dock && vis) dock.classList.toggle('hide', vis.hero || vis.consult || vis.end || typing || !!(cdlg && cdlg.open) || !!(rsvDlg && rsvDlg.open));
    if (fab && vis) fab.classList.toggle('hide', vis.hero);   /* PC: 첫 화면 카톡 버튼과 겹쳐 셋이 되지 않게 */
  }
  if ((dock || fab) && IO) {
    var watch = function (el, k) { if (el) new IntersectionObserver(function (es) { vis[k] = es[0].isIntersecting; dockSync(); }, { threshold: 0 }).observe(el); };
    watch(heroCta, 'hero'); watch(consultEl, 'consult'); watch(endEl, 'end');
    if (cdlg) cdlg.addEventListener('close', dockSync);
  } else { if (dock) dock.classList.remove('hide'); if (fab) fab.classList.remove('hide'); }
  doc.addEventListener('focusin', function (ev) { if (ev.target.matches && ev.target.matches('input, textarea')) { typing = true; dockSync(); } });
  doc.addEventListener('focusout', function () { typing = false; dockSync(); });

  /* 상담 시간(평일 10:00–17:30, 한국 시간) 밖이면 고정 바의 '전화'를 '전화 예약'(번호 남기기)으로 바꾼다 */
  (function () {
    var k = new Date(Date.now() + 9 * 36e5), d = k.getUTCDay(), m = k.getUTCHours() * 60 + k.getUTCMinutes();
    if (d >= 1 && d <= 5 && m >= 600 && m < 1050) return;
    $$('[data-hours-tel]').forEach(function (b) {
      b.setAttribute('href', '#rsv'); b.removeAttribute('data-tel'); b.setAttribute('data-track', 'consult_jump_hero');
      b.classList.add('off'); var t = $('[data-tel-t]', b); if (t) t.textContent = '전화 예약';
    });
    var a = $('[data-tel="dock"]'); if (!a) return;
    a.setAttribute('href', '#rsv'); a.removeAttribute('data-tel');
    a.setAttribute('data-track', 'consult_jump_dock'); a.removeAttribute('aria-label');   /* 보이는 글 '전화 예약'이 곧 이름 */
    var s = $('[data-dock-t]', a); if (s) s.textContent = '전화 예약';
  })();

  /* ── 아래 떠 있는 '택스민 기장 문의'(웍스 '도입 문의' 꼴): 누르면 카톡 상담·예약 상담·전화 상담 */
  var askBtn = $('[data-ask-btn]'), askMenu = $('#ask-menu');
  if (askBtn && askMenu) {
    var askSet = function (on) { askMenu.hidden = !on; askBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); };
    askBtn.addEventListener('click', function (ev) { ev.stopPropagation(); var on = askMenu.hidden; askSet(on); if (on) track('ask_open', {}); });
    doc.addEventListener('click', function (ev) { if (!askMenu.hidden && !ev.target.closest('[data-ask]')) askSet(false); });
    doc.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !askMenu.hidden) { askSet(false); askBtn.focus(); } });
    askMenu.addEventListener('click', function () { setTimeout(function () { askSet(false); }, 0); });
  }

  /* ── 전화 예약: '#rsv' 로 가는 버튼(첫 화면 시간 밖·고정 바·계산 팝업·PC 안내 창·마무리 띠)을 누르면 예약 팝업 */
  if (rsvDlg) {
    doc.addEventListener('click', function (ev) {
      var a = ev.target.closest('a[href="#rsv"]');
      if (!a) return;
      ev.preventDefault();
      var inD = a.closest('dialog'); if (inD && inD !== rsvDlg) closeDlg(inD);
      openDlg(rsvDlg); dockSync();
      track('rsv_open', { position: a.getAttribute('data-track') || '' });
      var t = $('#r-tel', rsvDlg); if (t && isPC()) { try { t.focus({ preventScroll: true }); } catch (x) {} }
    });
    rsvDlg.addEventListener('close', dockSync);
  }

  /* ── 전화 상담(페이지 안 폼 → 구글 Apps Script → 사무소 시트·메일). 서버가 받았다고 답할 때만 '접수됐어요' */
  var form = $('[data-rsv]');
  if (form) {
    var tI = $('#r-tel', form), oI = $('#r-ok', form), oI2 = $('#r-ok2', form);
    var out = $('.msg', form), sb = $('button[type=submit]', form);
    /* 단계별 간단 신청: 업종 카드 → 작년 매출 카드 → 번호·동의. 카드를 누르면 바로 다음 단계 · 진행 막대가 참 · > 는 동의 내용 펼치기 */
    var steps = $$('.ld-step', form), stepNo = 1, dlgEl = form.closest('dialog') || doc;
    var bar = $('[data-ld-bar]', dlgEl), tip = $('[data-ld-tip]', dlgEl), pick = $('[data-ld-pick]', form), more = $('[data-ld-more]', form), terms = $('#ld-terms', form);
    var val = function (n) { return (form.querySelector('input[name=' + n + ']:checked') || {}).value || ''; };
    var ldSync = function () {
      var d = tI.value.replace(/\D/g, ''), okT = /^(010\d{8}|01[16789]\d{7,8})$/.test(d), okC = oI.checked;
      var pct = stepNo === 1 ? 22 : stepNo === 2 ? 50 : okT && okC ? 100 : okT || okC ? 88 : 76;
      if (bar) bar.style.width = pct + '%';
      if (tip) { tip.style.left = 'min(calc(' + pct + '% - 8px), calc(100% - 66px))'; tip.innerHTML = stepNo === 3 ? '거의 <b>다 됐어요!</b>' : '신청까지 <b>10초!</b>'; }
      sb.classList.toggle('on', okT && okC);
    };
    var goStep = function (n) {
      stepNo = Math.max(1, Math.min(3, n));
      steps.forEach(function (st) { st.classList.toggle('on', +st.getAttribute('data-step') === stepNo); });
      if (pick && stepNo === 3) pick.textContent = [val('ind'), val('rev') ? '작년 매출 ' + val('rev') : ''].filter(Boolean).join(' · ');
      ldSync();
      if (stepNo === 3 && isPC()) { try { tI.focus({ preventScroll: true }); } catch (x) {} }
    };
    form.addEventListener('click', function (e) {
      var r = e.target.closest('input[type=radio]'); if (!r) return;
      var st = +r.closest('.ld-step').getAttribute('data-step');
      track('rsv_step', { step: st, value: r.value });
      setTimeout(function () { goStep(st + 1); }, 160);
    });
    $$('[data-ld-back]', form).forEach(function (b) { b.addEventListener('click', function () { goStep(stepNo - 1); }); });
    tI.addEventListener('input', ldSync); oI.addEventListener('change', ldSync); goStep(1);
    if (more && terms) more.addEventListener('click', function () { var on = terms.hidden; terms.hidden = !on; more.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    tI.addEventListener('input', function () {
      var d = tI.value.replace(/\D/g, '');
      if (/^8210/.test(d)) d = '0' + d.slice(2);
      d = d.slice(0, 11); if (!/^01/.test(d)) return;
      var mid = d.length === 10 ? 6 : 7;
      tI.value = d.length < 4 ? d : d.length <= mid ? d.slice(0, 3) + '-' + d.slice(3) : d.slice(0, 3) + '-' + d.slice(3, mid) + '-' + d.slice(mid);
    });
    tI.addEventListener('input', function () { tI.parentNode.classList.remove('bad'); tI.removeAttribute('aria-invalid'); tI.removeAttribute('aria-describedby'); });
    /* 손님이 업종을 직접 고르면 계산기가 더는 바꾸지 않음 */
    form.addEventListener('change', function (e) { if (e.target.name === 'ind') $$('input[name=ind]', form).forEach(function (x) { x.removeAttribute('data-auto'); }); });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); out.textContent = '';
      var tel = tI.value.trim(), digits = tel.replace(/\D/g, '');
      if (/^8210/.test(digits)) digits = '0' + digits.slice(2);
      /* 010 은 11자리만, 옛 011·016~019 는 10~11자리 */
      if (!/^(010\d{8}|01[16789]\d{7,8})$/.test(digits)) { tI.parentNode.classList.add('bad'); tI.setAttribute('aria-invalid', 'true'); tI.setAttribute('aria-describedby', 'r-msg'); out.textContent = '휴대폰 번호를 확인해 주세요. 예) 010-1234-5678'; tI.focus(); return; }
      if (!oI.checked) { out.textContent = '개인정보 수집·이용에 동의해 주세요.'; oI.focus(); return; }
      if (!ENDPOINT) { out.textContent = '지금은 온라인 예약을 받을 수 없어요. 전화(' + TEL + ')나 카톡으로 연락 주세요.'; return; }
      var when = (form.querySelector('input[name=when]:checked') || {}).value || '언제든';
      var ind = (form.querySelector('input[name=ind]:checked') || {}).value || '';
      var rv = (form.querySelector('input[name=rev]:checked') || {}).value || '';   /* 호칭 칸 대신 작년 매출(선택) — 시트 칸 이름은 그대로 */
      var R = LAST ? LAST.R : null, adOk = !!(oI2 && oI2.checked);   /* 들어온 곳·광고·캠페인은 [선택] 동의가 있을 때만 */
      var data = {
        type: 'lead', '요청': '전화 상담 예약', '이름': '(호칭 없음)', '연락처': tel, '통화 편한 시간': when,
        '업종': ind || (R ? R.ind : '-'), '남기실 말씀': R ? '계산기: ' + R.ind + ' · ' + R.rev + ' · 직원 ' + R.emp : '',
        '작년 매출': rv || (R ? R.rev : '-'), '직원(4대보험)': R ? R.emp : '-', '추천 요금제': R ? R.tier : '-',
        '예상 기장료': R ? R.price + ' (부가세 별도)' : '-',
        '들어온 곳': adOk ? SRC.full : '(광고 확인 동의 안 함)', '광고': adOk ? (SRC.ad || '-') : '-', '캠페인': adOk ? (SRC.camp || '-') : '-', '시안': PAGE,
        '개인정보 수집·이용 동의': '동의함', '_honey': (form.querySelector('[name=hp]') || {}).value || ''
      };
      sb.disabled = true; sb.textContent = '보내는 중…';
      var fail = function (t) { sb.disabled = false; sb.textContent = '상담 신청하기'; out.textContent = t || '보내지 못했어요. 잠시 뒤 다시 하시거나 전화(' + TEL + ')·카톡으로 연락 주세요.'; };
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
        .then(function (r) { return r.text(); })
        .then(function (t) {
          t = String(t || '').trim();
          if (t === 'bad') return fail('휴대폰 번호를 다시 확인해 주세요.');
          if (t !== 'ok' && t !== 'dup' && t !== 'held') return fail();
          track('form_submit', {});
          var whenTxt = when === '언제든' ? '평일 10:00–17:30 중 편하실 때' : when + '에';
          form.outerHTML = '<div class="consult done" role="status" tabindex="-1"><div class="ok">' + CK + '</div><h2>접수됐어요</h2>' +
            '<p>' + esc(whenTxt) + ' ' + esc(tel) + '로 전화드릴게요</p>' +
            '<a class="btn btn-primary btn-block" href="' + KAKAO + '" data-kakao="done" data-copy>' + KK + '카톡으로도 바로 묻기</a></div>';
          var dn = $('.consult.done'); if (dn) { try { dn.focus(); } catch (x) {} }   /* 초점이 사라지지 않게 접수 안내로 */
        })
        .catch(function () { fail(); });
    });
  }
})();
