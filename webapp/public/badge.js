/**
 * GL365 Badge Renderer — Trust Network Phase 1
 * Zero-dependency, cross-origin embeddable badge widget.
 * Loads lazily via IntersectionObserver for Core Web Vitals safety.
 */
(function () {
  'use strict';

  var API_BASE = 'https://greenline365.com/api/badges';
  var CACHE = {};

  // ── Styles (injected once) ────────────────────────────────────────
  var STYLES_ID = 'gl365-badge-styles';

  function injectStyles() {
    if (document.getElementById(STYLES_ID)) return;
    var style = document.createElement('style');
    style.id = STYLES_ID;
    style.textContent = [
      '.gl365-badge{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:10px;background:#111;color:#fff;text-decoration:none;cursor:pointer;position:relative;border:1px solid #333;transition:border-color .2s,box-shadow .2s;font-size:14px;line-height:1.4}',
      '.gl365-badge:hover{border-color:#39FF14;box-shadow:0 0 12px rgba(57,255,20,.25)}',
      '.gl365-badge--inactive{opacity:.5;filter:grayscale(1);pointer-events:none}',
      '.gl365-badge__logo{width:20px;height:20px;flex-shrink:0}',
      '.gl365-badge__info{display:flex;flex-direction:column;gap:1px}',
      '.gl365-badge__name{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}',
      '.gl365-badge__meta{font-size:11px;color:#aaa;display:flex;align-items:center;gap:6px}',
      '.gl365-badge__stars{color:#FFD700;font-size:12px;letter-spacing:1px}',
      '.gl365-badge__badges{display:flex;gap:4px;margin-left:4px}',
      '.gl365-badge__pill{font-size:9px;padding:2px 6px;border-radius:9999px;font-weight:600;color:#fff;white-space:nowrap}',
      '.gl365-badge__tooltip{display:none;position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#222;color:#ccc;font-size:11px;padding:8px 12px;border-radius:6px;white-space:nowrap;border:1px solid #444;z-index:9999;pointer-events:none}',
      '.gl365-badge__tooltip::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:#222}',
      '.gl365-badge:hover .gl365-badge__tooltip{display:block}',
      '.gl365-badge--minimal{padding:6px 12px;border-radius:8px;gap:6px}',
      '.gl365-badge--minimal .gl365-badge__name{font-size:12px;max-width:160px}',
      '.gl365-badge--minimal .gl365-badge__meta{font-size:10px}',
      '.gl365-badge--minimal .gl365-badge__badges{display:none}',
      '.gl365-badge--compact{padding:4px 10px;border-radius:6px;gap:4px}',
      '.gl365-badge--compact .gl365-badge__info{display:none}',
      '.gl365-badge--compact .gl365-badge__tooltip{display:none}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Star rendering ────────────────────────────────────────────────
  function renderStars(rating) {
    var full = Math.floor(rating);
    var half = rating - full >= 0.5 ? 1 : 0;
    var empty = 5 - full - half;
    var s = '';
    for (var i = 0; i < full; i++) s += '\u2605';
    if (half) s += '\u00BD';
    for (var j = 0; j < empty; j++) s += '\u2606';
    return s;
  }

  // ── GL365 shield icon (inline SVG) ────────────────────────────────
  var SHIELD_SVG = '<svg class="gl365-badge__logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#39FF14" opacity="0.2"/><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="#39FF14" stroke-width="1.5" fill="none"/><path d="M9 12l2 2 4-4" stroke="#39FF14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ── Fetch badge data ──────────────────────────────────────────────
  function fetchBadgeData(partnerId, callback) {
    if (CACHE[partnerId]) {
      callback(null, CACHE[partnerId]);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', API_BASE + '/' + encodeURIComponent(partnerId), true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          CACHE[partnerId] = data;
          callback(null, data);
        } catch (e) {
          callback(e, null);
        }
      } else {
        callback(new Error('HTTP ' + xhr.status), null);
      }
    };
    xhr.onerror = function () {
      callback(new Error('Network error'), null);
    };
    xhr.send();
  }

  // ── Render a single badge element ─────────────────────────────────
  function renderBadge(el, data) {
    var style = el.getAttribute('data-style') || 'default';
    var inactive = !data.subscriptionActive;

    var classes = ['gl365-badge'];
    if (style === 'minimal') classes.push('gl365-badge--minimal');
    if (style === 'compact') classes.push('gl365-badge--compact');
    if (inactive) classes.push('gl365-badge--inactive');

    // Badge pills
    var pillsHtml = '';
    if (data.badges && data.badges.length > 0) {
      for (var i = 0; i < data.badges.length; i++) {
        var b = data.badges[i];
        pillsHtml += '<span class="gl365-badge__pill" style="background:' + escapeAttr(b.badge_color) + '">' + escapeHtml(b.badge_label) + '</span>';
      }
    }

    // Tooltip
    var tooltipText = 'Verified: ' + data.stats.reviewCount + ' Reviews | Trust Score: ' + data.stats.trustScore;

    var html = '<a href="' + escapeAttr(data.bookingUrl) + '" target="_blank" rel="noopener noreferrer" class="' + classes.join(' ') + '">'
      + SHIELD_SVG
      + '<div class="gl365-badge__info">'
      + '<span class="gl365-badge__name">' + escapeHtml(data.businessName) + '</span>'
      + '<span class="gl365-badge__meta">'
      + '<span class="gl365-badge__stars">' + renderStars(data.stats.avgRating) + '</span>'
      + '<span>' + data.stats.avgRating.toFixed(1) + '</span>'
      + '<span class="gl365-badge__badges">' + pillsHtml + '</span>'
      + '</span>'
      + '</div>'
      + '<div class="gl365-badge__tooltip">' + escapeHtml(tooltipText) + '</div>'
      + '</a>';

    el.innerHTML = html;
    el.setAttribute('data-gl365-rendered', 'true');
  }

  // ── Safety helpers ────────────────────────────────────────────────
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Lazy loading with IntersectionObserver ────────────────────────
  function initBadge(el) {
    if (el.getAttribute('data-gl365-rendered')) return;

    var partnerId = el.getAttribute('data-partner-id');
    if (!partnerId) return;

    fetchBadgeData(partnerId, function (err, data) {
      if (err || !data) {
        el.innerHTML = '';
        return;
      }
      renderBadge(el, data);
    });
  }

  function init() {
    injectStyles();

    var elements = document.querySelectorAll('[data-gl365-badge]:not([data-gl365-rendered])');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            initBadge(entries[i].target);
            observer.unobserve(entries[i].target);
          }
        }
      }, { rootMargin: '200px' });

      for (var i = 0; i < elements.length; i++) {
        observer.observe(elements[i]);
      }
    } else {
      // Fallback: load all immediately
      for (var j = 0; j < elements.length; j++) {
        initBadge(elements[j]);
      }
    }
  }

  // ── Boot ──────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
