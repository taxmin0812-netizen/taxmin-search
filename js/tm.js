/* 택스민 랜딩 동작: 출처 기록 · 전환 신호 · 첫 화면 시연(영상 + 3장면 자동 넘김) · 계산기 · 흐름띠 · 숫자 세기 ·
   전화 상담(페이지 안 폼) · 카톡(PC 안내) · 아래 고정 버튼.
   요금 규칙은 택스민 요금 등급표(개인사업자, 직전 연도 매출 기준)와 같다:
   기본 월 5만(직원 3명까지)·6만(4~5명) / 중간 월 7~8만 / 성실신고확인 월 12~15만 / 법인 월 10만부터 — 모두 부가세 별도, 6개월 약정.
   카톡은 쿼리 없는 채널 채팅 주소를 같은 탭에서 연다(앱 안 브라우저·구글 팝업 규정). PC 는 카카오 로그인이 필요해 안내 창을 먼저 보인다.
   움직임 줄이기 설정·검색 로봇·화면 캡처에서는 영상·자동 넘김·흐름띠·숫자 세기를 모두 하지 않는다(처음부터 다 보임). */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, C = window.TM || {};
  var KAKAO = C.kakao || 'https://pf.kakao.com/_Mxojqs/chat';
  var TEL = C.tel || '0507-1445-7729';
  var ENDPOINT = C.endpoint || '';
  var PAGE = (C.pagePrefix || 'srch-') + (doc.body.getAttribute('data-page') || 'main');
  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var bot = /bot|crawl|spider|Yeti|AdsBot|Lighthouse|HeadlessChrome|PageSpeed/i.test(navigator.userAgent) || /[?&]norv\b/.test(location.search);
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
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2800);
  }
  function copyText(t) {
    var ok = false;
    try {
      var ta = doc.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', ''); ta.className = 'hp';
      doc.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
      ok = doc.execCommand('copy'); doc.body.removeChild(ta);
    } catch (x) { ok = false; }
    return ok;
  }

  /* ── 머리줄: 내리면 떠 있는 캡슐 · 스크롤 등장 */
  var hd = $('[data-hd]');
  function onScroll() { if (hd) hd.classList.toggle('on', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (!still && IO) {
    root.classList.add('js-rv');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(function (el) { io.observe(el); });
  }

  /* ── 첫 화면 시연 */
  var show = $('[data-show]');
  if (show) {
    var frame = $('.show-frame', show), video = $('.show-bg', show);
    var scenes = $$('.scene', show), tabs = $$('[data-go]', show), caps = $$('[data-cap]', show);
    var cur = 0, timer = null, t0 = 0, raf = 0, seen = false, held = false, DUR = 7000, chatT = [];
    /* 배경 영상: 사진을 먼저 보이고, 영상은 페이지가 다 뜬 뒤 받아서 재생되면 겹친다(데이터 절약 모드·움직임 줄이기는 사진만) */
    var save = navigator.connection && navigator.connection.saveData;
    if (video && !still && !save) {
      var startVideo = function () {
        if (video.src) return;
        video.src = video.getAttribute('data-src');
        video.addEventListener('playing', function () { video.classList.add('on'); }, { once: true });
        var p = video.play(); if (p && p.catch) p.catch(function () {});
      };
      if (doc.readyState === 'complete') setTimeout(startVideo, 300); else window.addEventListener('load', function () { setTimeout(startVideo, 300); });
      onView(frame, function (v) { if (!video.src) return; if (v) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } else video.pause(); });
    }
    var chatPlay = function (sc) {
      chatT.forEach(clearTimeout); chatT = [];
      var bubs = $$('.bub', sc), typ = $('.typing', sc), t = 200;
      bubs.forEach(function (b) { b.classList.remove('in'); });
      if (typ) typ.classList.remove('on');
      bubs.forEach(function (b) {
        var us = b.classList.contains('us');
        if (us && typ) { chatT.push(setTimeout(function () { sc.insertBefore(typ, b); typ.classList.add('on'); }, t)); t += 900; }
        chatT.push(setTimeout(function () { if (typ) typ.classList.remove('on'); b.classList.add('in'); }, t));
        t += us ? 700 : 650;
      });
    };
    var go = function (i, user) {
      cur = (i + scenes.length) % scenes.length;
      scenes.forEach(function (s, k) {
        s.classList.remove('on');
        if (k === cur) { void s.offsetWidth; s.classList.add('on'); }
      });
      tabs.forEach(function (b, k) { b.setAttribute('aria-selected', k === cur ? 'true' : 'false'); b.style.removeProperty('--p'); });
      caps.forEach(function (c, k) { c.hidden = k !== cur; });
      if (!still && $('.bub', scenes[cur])) chatPlay(scenes[cur]);
      t0 = performance.now();
      if (user) held = false;
    };
    var tick = function (now) {
      raf = 0;
      if (!seen || held || still) return;
      var p = Math.min(1, (now - t0) / DUR);
      if (tabs[cur]) tabs[cur].style.setProperty('--p', p.toFixed(3));
      if (p >= 1) go(cur + 1);
      raf = requestAnimationFrame(tick);
    };
    var run = function () { if (!raf && !still) raf = requestAnimationFrame(tick); };
    tabs.forEach(function (b, k) { b.addEventListener('click', function () { go(k, true); track('show_tab', { tab: k }); }); });
    var pv = $('[data-prev]', show), nx = $('[data-next]', show);
    if (pv) pv.addEventListener('click', function () { go(cur - 1, true); });
    if (nx) nx.addEventListener('click', function () { go(cur + 1, true); });
    if (!still) {
      frame.classList.add('play');
      show.addEventListener('mouseenter', function () { held = true; });
      show.addEventListener('mouseleave', function () { held = false; t0 = performance.now(); run(); });
      onView(show, function (v) { seen = v; if (v) { if (!t0) go(0); else t0 = performance.now(); run(); } }, { threshold: 0.35 });
    }
  }

  /* ── 계산기 */
  var KK = '<span class="kk"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6c-5 0-9 3.1-9 7 0 2.5 1.7 4.7 4.2 5.9l-.9 3.5c-.1.4.4.7.7.4l4.2-2.8h.8c5 0 9-3.1 9-7s-4-7-9-7z" fill="currentColor"/></svg></span>';
  var CK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.3 4.3L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  /* 업종군: A 도소매 · B 음식·제조·건설·운수·IT · C 서비스·교육·임대·전문직·그 밖 · X 법인 / 마지막 칸 = 3D 그림(Higgsfield) */
  var IND = [['food', 'B', '음식점 · 카페 · 숙박', 'coffee'], ['retail', 'A', '도소매 · 온라인 판매', 'box'], ['personal', 'C', '미용 · 네일 · 세탁', 'scissors'],
    ['free', 'C', '프리랜서 · 크리에이터', 'play'], ['edu', 'C', '학원 · 교습소', 'book'], ['biz', 'C', '디자인 · 광고 · 컨설팅', 'laptop'],
    ['mfg', 'B', '제조 · 건설 · 운수', 'roller'], ['it', 'B', 'IT · 소프트웨어', 'laptop'], ['rent', 'C', '부동산 임대', 'house'], ['pro', 'P', '전문직(의료·법률 등)', 'building'],
    ['etc', '?', '그 밖의 업종', 'shop'], ['corp', 'X', '법인사업자예요', 'building']];
  var TO_CONSULT = { food: '카페·음식점', retail: '도소매·온라인 판매', free: '크리에이터·프리랜서', corp: '법인' };
  var EMP = [['0', '없어요'], ['3', '1~3명'], ['5', '4~5명'], ['10', '6명 이상']];
  var BAND = {
    A: { lo: '9억원', hi: '15억원', loM: '7,500만원', hiM: '1억 2,500만원' },
    B: { lo: '5억원', hi: '7억 5천만원', loM: '약 4,200만원', hiM: '약 6,300만원' },
    C: { lo: '3억원', hi: '5억원', loM: '2,500만원', hiM: '약 4,200만원' }
  };
  var RES0 = '<p class="lbl">예상 기장료</p><p class="price num">월 5만원부터<small>부가세 별도</small></p><p class="incl">작년 매출을 고르면 바로 계산돼요.</p>';
  function band(g) { return BAND[g === 'A' || g === 'B' ? g : 'C']; }

  var box = $('[data-calc]'), qBox = $('[data-calc-q]'), resBox = $('[data-calc-res]');
  var LAST = null, calcSent = false;
  if (box && qBox && resBox) {
    var IMG = box.getAttribute('data-img') || 'img/3d/';
    var A = { ind: null, rev: null, emp: null }, started = false;
    var chipsHtml = function (name, list, col) {
      return '<div class="chips' + (col ? ' col' : '') + '" data-name="' + name + '">' + list.map(function (x, i) {
        var hide = name === 'ind' && i >= 6;
        var pic = x[4] ? '<img src="' + IMG + x[4] + '.webp" alt="" width="30" height="30" loading="lazy">' : '';
        return '<button type="button" class="chip" aria-pressed="false" data-v="' + x[0] + '"' + (x[3] ? ' data-g="' + x[3] + '"' : '') + (hide ? ' hidden' : '') + '>' + pic + '<span>' + x[1] + '</span></button>';
      }).join('') + (name === 'ind' ? '<button type="button" class="chip more" data-more>다른 업종 보기</button>' : '') + '</div>';
    };
    qBox.innerHTML =
      '<div class="q" data-q="ind"><h3 class="q-t"><i>1</i>어떤 일을 하세요?</h3><p class="q-h">가장 가까운 업종을 골라 주세요.</p>' +
        chipsHtml('ind', IND.map(function (x) { return [x[0], x[2], 0, x[1], x[3]]; })) + '</div>' +
      '<div class="q" data-q="rev" hidden><h3 class="q-t"><i>2</i>작년 매출은 어느 정도예요?</h3><p class="q-h">대략이면 괜찮아요. 홈택스 매출 조회에서도 볼 수 있어요.</p>' +
        chipsHtml('rev', [['new', '올해 시작했어요<small>사업 준비 중 포함</small>'], ['lo', ''], ['mid', ''], ['hi', ''], ['unk', '잘 모르겠어요']], 1) + '</div>' +
      '<div class="q" data-q="emp" hidden><h3 class="q-t"><i>3</i>4대보험 직원은 몇 명이에요?</h3><p class="q-h">사장님 본인은 빼고 세어 주세요.</p>' +
        chipsHtml('emp', EMP, 0) + '</div>';
    var qs = {}; $$('.q', qBox).forEach(function (el) { qs[el.getAttribute('data-q')] = el; });

    var press = function (group, chip) { $$('.chip', group).forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); }); };
    var revLabels = function (g) {
      var b = band(g);
      var L = { lo: b.lo + ' 이하<small>한 달 평균 ' + b.loM + ' 이하</small>',
                mid: b.lo + ' 초과 ~ ' + b.hi + ' 미만<small>한 달 평균 ' + b.loM + ' ~ ' + b.hiM + '</small>',
                hi: b.hi + ' 이상<small>한 달 평균 ' + b.hiM + ' 이상</small>' };
      $$('.chip', qs.rev).forEach(function (c) { var v = c.getAttribute('data-v'); if (L[v]) $('span', c).innerHTML = L[v]; c.setAttribute('aria-pressed', 'false'); });
    };
    var txt = function (chip) { if (!chip) return '-'; var s = $('span', chip) || chip; return (s.childNodes[0].textContent || s.textContent).trim(); };

    var compute = function () {
      var g = A.ind.getAttribute('data-g');
      var rv = A.rev ? A.rev.getAttribute('data-v') : '';
      var emp = A.emp ? +A.emp.getAttribute('data-v') : 0;
      var R = { key: A.ind.getAttribute('data-v'), ind: txt(A.ind), rev: A.rev ? txt(A.rev) : '-', emp: A.emp ? txt(A.emp) : '-', tier: '', price: '', won: [], why: '', sub: '', corp: false };
      if (g === 'X') {
        R.corp = true; R.tier = '법인'; R.price = '월 10만원부터'; R.won = [100000]; R.rev = '-'; R.emp = '-';
        R.why = '법인은 장부 상태와 거래량을 보고 상담 때 확정해요.';
        return R;
      }
      var b = band(g), t = rv === 'new' || rv === 'lo' ? 'L' : rv === 'mid' ? 'P' : rv === 'hi' ? 'S' : 'U';
      if (t === 'L' && emp > 5) { t = 'P'; R.why = '4대보험 직원이 6명 이상이면 이 구간이에요.'; }
      if (t === 'L') { R.tier = '기본 구간'; R.price = emp > 3 ? '월 6만원' : '월 5만원'; R.won = [emp > 3 ? 60000 : 50000]; if (emp <= 3) R.sub = '직원이 4~5명이면 월 6만원이에요.'; }
      else if (t === 'U') { R.tier = '구간 확인 필요'; R.price = '월 5만원부터'; R.won = [50000]; R.why = '작년 매출에 따라 구간이 정해져요. 상담 때 홈택스 자료로 함께 확인해 드릴게요.'; }
      else if (t === 'S') { R.tier = '성실신고확인 구간'; R.price = '월 12~15만원'; R.won = [120000, 150000]; R.why = '작년 매출이 ' + b.hi + ' 이상이면 성실신고확인 대상이라 이 구간이에요.'; }
      else { R.tier = '중간 구간'; R.price = '월 7~8만원'; R.won = [70000, 80000]; if (!R.why) R.why = '작년 매출이 ' + b.lo + '을 넘으면 이 구간이에요.'; R.sub = '작년 매출이 ' + b.hi + ' 이상이 되면 월 12~15만원이에요.'; }
      if (g === '?' && t !== 'L') R.why = (R.why ? R.why + ' ' : '') + '그 밖의 업종은 기준이 다를 수 있어 상담 때 확정해요.';
      /* 중간·성실 구간의 직원 수 상한은 아직 정하지 않음 → 6명 이상이면 상담 때 확정(규정 검수 11/4) */
      if (emp > 5) R.why = (R.why ? R.why + ' ' : '') + '직원이 많으면 인원에 따라 상담 때 확정해요.';
      return R;
    };
    var inclLine = function (R) {
      if (R.won.length === 2) return '부가세 포함 월 ' + won(R.won[0] * 1.1) + ' ~ ' + won(R.won[1] * 1.1);
      return '부가세 포함 월 ' + won(R.won[0] * 1.1) + (R.corp || R.tier === '구간 확인 필요' ? '부터' : '');
    };
    var render = function (R, final) {
      var items = R.corp ? ['법인 장부 정리', '부가가치세 신고', '직원 월급 신고(원천세)']
        : ['장부 정리(복식부기)', '매달 매출 보고서', '부가가치세 신고', '직원 월급 신고(원천세)'];
      resBox.innerHTML = '<p class="lbl">예상 기장료 · ' + esc(R.tier) + '</p>' +
        '<p class="price num">' + esc(R.price) + '<small>부가세 별도</small></p>' +
        '<p class="incl num">' + inclLine(R) + '</p>' +
        (R.why ? '<p class="why">' + esc(R.why) + '</p>' : '') +
        (R.sub ? '<p class="why dim">' + esc(R.sub) + '</p>' : '') +
        (!final ? '<p class="why dim">직원 수를 고르면 더 정확해져요.</p>' : '') +
        '<ul>' + items.map(function (x) { return '<li>' + CK + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<p class="terms">6개월 약정 · ' + (R.corp ? '법인세' : '종합소득세') + ' 신고 비용은 따로(신고 전에 먼저 안내)</p>' +
        '<div class="acts">' +
          '<a class="btn btn-primary btn-block" href="' + KAKAO + '" data-kakao="calc" data-copy>' + KK + '이 결과로 카톡 상담</a>' +
          '<a class="btn btn-line btn-block" href="#consult" data-track="consult_jump_calc">전화 상담 예약</a>' +
        '</div>' +
        '<p class="hint">카톡 버튼을 누르면 계산 결과가 복사돼요. 카톡 창에서 붙여넣기만 하세요.</p>';
      if (!still) { resBox.classList.remove('pop'); void resBox.offsetWidth; resBox.classList.add('pop'); }
      /* 카톡에 붙여 넣는 글: 검색어는 넣지 않고 짧은 안내 번호만(N 네이버 광고 · G 구글 광고 · W 그 밖 - 쪽 이름) */
      LAST = {
        R: R,
        text: '[택스민 기장료 상담]\n업종: ' + R.ind + '\n작년 매출: ' + R.rev + '\n4대보험 직원: ' + R.emp +
          '\n예상 기장료: ' + R.price + ' (부가세 별도, ' + R.tier + ')\n(안내 번호 ' + ({ naver_ad: 'N', google_ad: 'G' }[SRC.key] || 'W') + '-' + PAGE.slice(5) + ')'
      };
      /* 전화 상담 폼의 업종: 손님이 직접 고르지 않았으면 계산 결과를 따라감 */
      var cv = TO_CONSULT[R.key] || '서비스·기타';
      var f = $('[data-rsv]');
      if (f) {
        var cur = f.querySelector('input[name=ind]:checked');
        if (!cur || cur.hasAttribute('data-auto')) {
          if (cur) cur.removeAttribute('data-auto');
          var r = f.querySelector('input[name=ind][value="' + cv + '"]');
          if (r) { r.checked = true; r.setAttribute('data-auto', ''); }
        }
      }
      if (final && !calcSent) { calcSent = true; track('calc_complete', { tier: R.tier, price: R.price }); }
      dockSync();
    };
    var next = function (el) {
      requestAnimationFrame(function () {
        var r = el.getBoundingClientRect();
        if (r.top > window.innerHeight - 140 || r.bottom > window.innerHeight - 90) el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
      });
    };
    var pickInd = function (chip, silent) {
      A.ind = chip; A.rev = null; A.emp = null;
      press($('[data-name="ind"]', qBox), chip);
      var g = chip.getAttribute('data-g');
      if (!started && !silent) { started = true; track('calc_start', {}); }
      if (g === 'X') { qs.rev.hidden = true; qs.emp.hidden = true; render(compute(), !silent); return; }
      revLabels(g); qs.rev.hidden = false; qs.emp.hidden = true;
      press(qs.emp, null);
      /* 업종을 바꾸면 앞 업종의 결과를 지움(틀린 금액이 복사·접수되지 않게) */
      LAST = null; resBox.innerHTML = RES0; dockSync();
    };
    qBox.addEventListener('click', function (ev) {
      var more = ev.target.closest('[data-more]');
      if (more) { $$('.chip[hidden]', qBox).forEach(function (c) { c.hidden = false; }); more.remove(); return; }
      var chip = ev.target.closest('.chip'); if (!chip) return;
      var name = chip.parentNode.getAttribute('data-name');
      if (name === 'ind') { pickInd(chip); if (!qs.rev.hidden) next(qs.rev); }
      else if (name === 'rev') { A.rev = chip; press(qs.rev, chip); qs.emp.hidden = false; render(compute(), !!A.emp); if (!A.emp) next(qs.emp); }
      else if (name === 'emp') { A.emp = chip; press(qs.emp, chip); render(compute(), true); next(resBox); }
    });
    var pre = box.getAttribute('data-ind');
    if (pre) { var pc = $('.chip[data-v="' + pre + '"]', qBox); if (pc) { pc.hidden = false; pickInd(pc, true); } }
  }

  /* ── 업종 흐름띠: 칩을 한 벌 더 붙여 끝없이 흐르게(움직임 줄이기·캡처는 멈춘 채 여러 줄) · 화면 밖이면 멈춤 */
  var marq = $('.marq');
  if (marq && !still) {
    $$('.mtrack', marq).forEach(function (t) { t.innerHTML += t.innerHTML; });
    root.classList.add('js-mq');
    onView(marq, function (v) { $$('.mtrack', marq).forEach(function (t) { t.style.animationPlayState = v ? 'running' : 'paused'; }); });
  }

  /* ── 숫자 세기(마무리 카드): 보일 때 한 번 */
  var stats = $('[data-stats]');
  if (stats && !still && IO) {
    var ems = $$('[data-count]', stats), done = false;
    ems.forEach(function (el) { el.textContent = '0'; });
    onView(stats, function (v) {
      if (!v || done) return; done = true;
      var t0 = performance.now();
      (function step(now) {
        var p = Math.min(1, (now - t0) / 1200), k = 1 - Math.pow(1 - p, 3);
        ems.forEach(function (el) { el.textContent = Math.round(+el.getAttribute('data-count') * k).toLocaleString('ko-KR'); });
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.4 });
  }

  /* ── PC 카톡 안내 창 */
  var pcDlg = $('#kk-pc');
  function openDlg(d) { if (!d) return; if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', ''); }
  function closeDlg(d) { if (!d) return; if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); }
  if (pcDlg) pcDlg.addEventListener('click', function (ev) { if (ev.target === pcDlg || ev.target.closest('[data-close]')) closeDlg(pcDlg); });

  /* ── 클릭: 카톡·전화·기타 */
  doc.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-kakao]');
    if (a) {
      var copied = a.hasAttribute('data-copy') && LAST ? copyText(LAST.text) : false;
      track('kakao_click', { position: a.getAttribute('data-kakao'), device: isPC() ? 'pc' : 'mobile' });
      if (copied) toast('계산 결과를 복사했어요. 카톡 창에 붙여넣어 보내 주세요.');
      if (isPC() && pcDlg) { ev.preventDefault(); openDlg(pcDlg); return; }
      /* 휴대폰: 같은 탭에서 채널 채팅 주소로 이동. 광고 전환 태그가 켜져 있으면 신호가 나갈 틈(0.3초)을 둔다. */
      if ((C.gads || C.naverWa) && !(ev.metaKey || ev.ctrlKey || ev.shiftKey)) {
        ev.preventDefault(); var goTo = a.href;
        setTimeout(function () { location.href = goTo; }, 300);
      }
      return;
    }
    var t = ev.target.closest('[data-tel]');
    if (t) { track('tel_click', { position: t.getAttribute('data-tel') }); return; }
    var tr = ev.target.closest('[data-track]');
    if (tr) track(tr.getAttribute('data-track'), {});
  });

  /* ── 아래 고정 버튼: 첫 화면 버튼이 안 보일 때만. 계산 결과·상담 판·마무리가 보이거나 입력 중이면 숨김 */
  var dock = $('[data-dock]'), heroCta = $('.hero .cta'), consultEl = $('#consult'), endEl = $('.closing');
  var vis = { hero: true, consult: false, end: false, calc: false }, typing = false;
  function dockSync() { if (dock && vis) dock.classList.toggle('hide', vis.hero || vis.consult || vis.end || (vis.calc && !!LAST) || typing); }
  if (dock && IO) {
    var watch = function (el, k) { if (el) new IntersectionObserver(function (es) { vis[k] = es[0].isIntersecting; dockSync(); }, { threshold: 0 }).observe(el); };
    watch(heroCta, 'hero'); watch(consultEl, 'consult'); watch(endEl, 'end'); watch(resBox, 'calc');
  } else if (dock) { dock.classList.remove('hide'); }
  doc.addEventListener('focusin', function (ev) { if (ev.target.matches && ev.target.matches('input, textarea')) { typing = true; dockSync(); } });
  doc.addEventListener('focusout', function () { typing = false; dockSync(); });

  /* 상담 시간(평일 10:00–17:30, 한국 시간) 밖이면 고정 바의 '전화'를 '전화 예약'(번호 남기기)으로 바꾼다 */
  (function () {
    var k = new Date(Date.now() + 9 * 36e5), d = k.getUTCDay(), m = k.getUTCHours() * 60 + k.getUTCMinutes();
    if (d >= 1 && d <= 5 && m >= 600 && m < 1050) return;
    var a = $('[data-tel="dock"]'); if (!a) return;
    a.setAttribute('href', '#consult'); a.removeAttribute('data-tel');
    a.setAttribute('data-track', 'consult_jump_dock'); a.setAttribute('aria-label', '전화 상담 예약');
    var s = $('[data-dock-t]', a); if (s) s.textContent = '전화 예약';
  })();

  /* ── 전화 상담(페이지 안 폼 → 구글 Apps Script → 사무소 시트·메일). 서버가 받았다고 답할 때만 '접수됐어요' */
  var form = $('[data-rsv]');
  if (form) {
    var nI = $('#r-name', form), tI = $('#r-tel', form), oI = $('#r-ok', form);
    var out = $('.msg', form), sb = $('button[type=submit]', form);
    tI.addEventListener('input', function () {
      var d = tI.value.replace(/\D/g, '');
      if (/^8210/.test(d)) d = '0' + d.slice(2);
      d = d.slice(0, 11); if (!/^01/.test(d)) return;
      var mid = d.length === 10 ? 6 : 7;
      tI.value = d.length < 4 ? d : d.length <= mid ? d.slice(0, 3) + '-' + d.slice(3) : d.slice(0, 3) + '-' + d.slice(3, mid) + '-' + d.slice(mid);
    });
    tI.addEventListener('input', function () { tI.parentNode.classList.remove('bad'); });
    /* 손님이 업종을 직접 고르면 계산기가 더는 바꾸지 않음 */
    form.addEventListener('change', function (e) { if (e.target.name === 'ind') $$('input[name=ind]', form).forEach(function (x) { x.removeAttribute('data-auto'); }); });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); out.textContent = '';
      var tel = tI.value.trim(), digits = tel.replace(/\D/g, '');
      if (/^8210/.test(digits)) digits = '0' + digits.slice(2);
      /* 010 은 11자리만, 옛 011·016~019 는 10~11자리 */
      if (!/^(010\d{8}|01[16789]\d{7,8})$/.test(digits)) { tI.parentNode.classList.add('bad'); out.textContent = '휴대폰 번호를 확인해 주세요. 예) 010-1234-5678'; tI.focus(); return; }
      if (!oI.checked) { out.textContent = '개인정보 수집·이용에 동의해 주세요.'; oI.focus(); return; }
      if (!ENDPOINT) { out.textContent = '지금은 온라인 예약을 받을 수 없어요. 전화(' + TEL + ')나 카톡으로 연락 주세요.'; return; }
      var when = (form.querySelector('input[name=when]:checked') || {}).value || '언제든';
      var ind = (form.querySelector('input[name=ind]:checked') || {}).value || '';
      var R = LAST ? LAST.R : null;
      var data = {
        type: 'lead', '요청': '전화 상담 예약', '이름': nI.value.trim() || '(호칭 없음)', '연락처': tel, '통화 편한 시간': when,
        '업종': ind || (R ? R.ind : '-'), '남기실 말씀': R ? '계산기 업종: ' + R.ind : '',
        '작년 매출': R ? R.rev : '-', '직원(4대보험)': R ? R.emp : '-', '추천 요금제': R ? R.tier : '-',
        '예상 기장료': R ? R.price + ' (부가세 별도)' : '-',
        '들어온 곳': SRC.full, '광고': SRC.ad || '-', '캠페인': SRC.camp || '-', '시안': PAGE,
        '개인정보 수집·이용 동의': '동의함', '_honey': (form.querySelector('[name=hp]') || {}).value || ''
      };
      sb.disabled = true; sb.textContent = '보내는 중…';
      var fail = function (t) { sb.disabled = false; sb.textContent = '상담 전화 받기'; out.textContent = t || '보내지 못했어요. 잠시 뒤 다시 하시거나 전화(' + TEL + ')·카톡으로 연락 주세요.'; };
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
        .then(function (r) { return r.text(); })
        .then(function (t) {
          t = String(t || '').trim();
          if (t === 'bad') return fail('휴대폰 번호를 다시 확인해 주세요.');
          if (t !== 'ok' && t !== 'dup' && t !== 'held') return fail();
          track('form_submit', {});
          var whenTxt = when === '언제든' ? '평일 10:00–17:30 중 편하실 때' : when + '에';
          form.outerHTML = '<div class="consult done" role="status"><div class="ok">' + CK + '</div><h2>접수됐어요</h2>' +
            '<p>' + esc(whenTxt) + ' ' + esc(tel) + '로 전화드릴게요.<br>급하시면 카톡으로 먼저 말씀해 주세요.</p>' +
            '<a class="btn btn-primary btn-block" href="' + KAKAO + '" data-kakao="done" data-copy>' + KK + '카톡으로도 바로 묻기</a></div>';
        })
        .catch(function () { fail(); });
    });
  }
})();
