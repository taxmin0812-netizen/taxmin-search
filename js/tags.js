/* 광고·분석 태그: config.js 에 값이 있을 때만 불러온다. 페이지 안 스크립트를 쓰지 않아 CSP 를 좁게 유지한다. */
(function () {
  'use strict';
  var c = window.TM || {}, doc = document;
  function load(src, cb) { var s = doc.createElement('script'); s.async = true; s.src = src; if (cb) s.onload = cb; doc.head.appendChild(s); }

  if (c.ga4 || c.gads) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    if (c.ga4) window.gtag('config', c.ga4);
    if (c.gads) window.gtag('config', c.gads);
    load('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(c.ga4 || c.gads));
  }

  if (c.naverWa) {
    load('https://wcs.naver.net/wcslog.js', function () {
      try {
        window.wcs_add = window.wcs_add || {};
        window.wcs_add.wa = c.naverWa;
        if (window.wcs && window.wcs.inflow) window.wcs.inflow();
        if (typeof window.wcs_do === 'function') window.wcs_do();
      } catch (e) {}
    });
  }

  /* tm.js 의 track() 이 부른다: 전환 이름 하나로 구글 광고·네이버 전환을 함께 보낸다. */
  window.TM_CONV = function (name) {
    try {
      if (c.gads && c.gadsLabels && c.gadsLabels[name] && typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', { send_to: c.gads + '/' + c.gadsLabels[name], transport_type: 'beacon' });
      }
    } catch (e) {}
    try {
      if (c.naverWa && c.naverConv && c.naverConv[name] && window.wcs && typeof window.wcs.trans === 'function') {
        window.wcs.trans({ type: c.naverConv[name] });
      }
    } catch (e) {}
  };
})();
