/* ==========================================================
   PVKit — وحدة موحّدة لكل ألعاب PlayVerse
   بتضيف: زر الرجوع للشاشة الرئيسية · زر التوقف اللحظي بمؤقت
   تنازلي وعدد مرات محدود · المؤقت التنازلي العام (٣٠ دقيقة)

   طريقة الاستخدام — قبل </body> في اللعبة:
     <script>window.PVKIT_CONFIG = {
        homeUrl   : 'index.html',
        breakSec  : 40,   // 40 للمرحلة الأساسية · 20 للكبار
        breakMax  : 2,    // مرتين للأساسية · مرة واحدة للكبار
        gameMinutes: 30,  // 0 = اللعبة عندها مؤقتها الخاص
        breakBtn  : true  // false = اللعبة عندها زر توقف خاص
     };<\/script>
     <script src="pvkit.js"><\/script>

   خطّافات اختيارية داخل اللعبة (إن وُجدت يستدعيها PVKit):
     window.PVKIT_PAUSE  = function(){ ... }
     window.PVKIT_RESUME = function(){ ... }
   ========================================================== */
(function () {
  'use strict';
  if (window.PVKit) return;

  var C = window.PVKIT_CONFIG || {};
  var HOME_URL    = C.homeUrl || 'index.html';
  var BREAK_SEC   = C.breakSec || 20;
  var BREAK_MAX   = C.breakMax || 1;
  var GAME_MIN    = (C.gameMinutes === undefined) ? 0 : C.gameMinutes;
  var SHOW_BREAK  = (C.breakBtn !== false);
  var SHOW_HOME   = (C.homeBtn  !== false);

  var breaksUsed = 0;
  var breakId = null, onBreak = false;
  var timeLeft = GAME_MIN * 60, timerId = null, timeUp = false, timerPaused = false;
  var pausedMedia = [];

  /* ---------- الأنماط ---------- */
  var css = ''
    + '#pvkBar{position:fixed;bottom:14px;inset-inline-start:14px;z-index:2147482000;'
    + 'display:flex;flex-direction:column;gap:9px;font-family:inherit}'
    + '.pvk-btn{width:50px;height:50px;border-radius:50%;border:2px solid rgba(255,255,255,.28);'
    + 'background:rgba(12,12,30,.88);color:#fff;font-size:21px;cursor:pointer;'
    + 'display:flex;align-items:center;justify-content:center;position:relative;'
    + 'box-shadow:0 4px 16px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);'
    + 'transition:transform .15s,background .2s;padding:0;line-height:1}'
    + '.pvk-btn:active{transform:scale(.92)}'
    + '.pvk-btn[disabled]{opacity:.38;cursor:not-allowed}'
    + '.pvk-count{position:absolute;top:-4px;inset-inline-end:-4px;min-width:19px;height:19px;'
    + 'border-radius:10px;background:#f59e0b;color:#0a0a1a;font-size:11px;font-weight:900;'
    + 'display:flex;align-items:center;justify-content:center;padding:0 4px}'
    + '#pvkClock{position:fixed;top:12px;inset-inline-start:12px;z-index:2147482000;'
    + 'padding:7px 15px;border-radius:22px;border:1.5px solid rgba(255,255,255,.25);'
    + 'background:rgba(12,12,30,.88);color:#fff;font-size:16px;font-weight:900;'
    + 'font-family:inherit;letter-spacing:.5px;box-shadow:0 4px 16px rgba(0,0,0,.4);'
    + '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}'
    + '#pvkClock.pvk-low{background:#7f1d1d;border-color:#fca5a5;animation:pvkPulse 1s infinite}'
    + '@keyframes pvkPulse{0%,100%{opacity:1}50%{opacity:.55}}'
    + '.pvk-ovl{position:fixed;inset:0;z-index:2147483000;display:none;'
    + 'flex-direction:column;align-items:center;justify-content:center;gap:18px;'
    + 'background:rgba(5,5,16,.94);color:#fff;font-family:inherit;text-align:center;padding:24px}'
    + '.pvk-ovl.on{display:flex}'
    + '.pvk-num{font-size:84px;font-weight:900;line-height:1;'
    + 'background:linear-gradient(135deg,#7c3aed,#06b6d4,#f59e0b);'
    + '-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}'
    + '.pvk-h{font-size:24px;font-weight:900}'
    + '.pvk-p{font-size:15px;color:#a5b4cf;max-width:340px;line-height:1.8}'
    + '.pvk-go{padding:13px 30px;border-radius:28px;border:2px solid rgba(255,255,255,.3);'
    + 'background:rgba(124,58,237,.85);color:#fff;font-family:inherit;font-size:16px;'
    + 'font-weight:900;cursor:pointer}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- عناصر الواجهة ---------- */
  var bar = document.createElement('div');
  bar.id = 'pvkBar';

  var homeBtn = null, breakBtn = null, countBadge = null, clock = null;

  if (SHOW_HOME) {
    homeBtn = document.createElement('button');
    homeBtn.className = 'pvk-btn';
    homeBtn.type = 'button';
    homeBtn.title = 'الرجوع للشاشة الرئيسية';
    homeBtn.setAttribute('aria-label', 'الرجوع للشاشة الرئيسية');
    homeBtn.textContent = '🏠';
    homeBtn.onclick = goHome;
    bar.appendChild(homeBtn);
  }

  if (SHOW_BREAK) {
    breakBtn = document.createElement('button');
    breakBtn.className = 'pvk-btn';
    breakBtn.type = 'button';
    breakBtn.title = 'توقف لحظي';
    breakBtn.setAttribute('aria-label', 'توقف لحظي');
    breakBtn.innerHTML = '⏸';
    countBadge = document.createElement('span');
    countBadge.className = 'pvk-count';
    countBadge.textContent = BREAK_MAX;
    breakBtn.appendChild(countBadge);
    breakBtn.onclick = startBreak;
    bar.appendChild(breakBtn);
  }

  var breakOvl = document.createElement('div');
  breakOvl.className = 'pvk-ovl';
  breakOvl.innerHTML = '<div class="pvk-h">☕ استراحة قصيرة</div>'
    + '<div class="pvk-num" id="pvkNum">' + BREAK_SEC + '</div>'
    + '<div class="pvk-p">الوقت واقف الآن — ارجعوا لما تجهزوا.<br>'
    + 'اللعبة بتكمّل لحالها لما يخلص العدّ.</div>';

  var timeOvl = document.createElement('div');
  timeOvl.className = 'pvk-ovl';
  timeOvl.innerHTML = '<div class="pvk-num">⏰</div>'
    + '<div class="pvk-h">انتهى الوقت</div>'
    + '<div class="pvk-p">خلصت الـ' + GAME_MIN + ' دقيقة المخصّصة للعبة.</div>';

  function boot() {
    document.body.appendChild(bar);
    document.body.appendChild(breakOvl);
    if (GAME_MIN > 0) {
      clock = document.createElement('div');
      clock.id = 'pvkClock';
      clock.textContent = fmt(timeLeft);
      document.body.appendChild(clock);
      document.body.appendChild(timeOvl);
      var go = document.createElement('button');
      go.className = 'pvk-go';
      go.type = 'button';
      go.textContent = '🏠 الرجوع للشاشة الرئيسية';
      go.onclick = function () { location.href = HOME_URL; };
      timeOvl.appendChild(go);
      startTimer();
    }
  }

  /* ---------- الرجوع للرئيسية ---------- */
  function goHome() {
    if (!confirm('بدك ترجع للشاشة الرئيسية؟ التقدّم في اللعبة رح يضيع.')) return;
    try { stopTimer(); } catch (e) {}
    location.href = HOME_URL;
  }

  /* ---------- التوقف اللحظي ---------- */
  function pauseMedia() {
    pausedMedia = [];
    var m = document.querySelectorAll('audio,video');
    for (var i = 0; i < m.length; i++) {
      if (!m[i].paused) { pausedMedia.push(m[i]); try { m[i].pause(); } catch (e) {} }
    }
  }
  function resumeMedia() {
    for (var i = 0; i < pausedMedia.length; i++) {
      try { var p = pausedMedia[i].play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    }
    pausedMedia = [];
  }

  function startBreak() {
    if (onBreak || timeUp) return;
    if (breaksUsed >= BREAK_MAX) return;
    breaksUsed++;
    onBreak = true;
    timerPaused = true;
    updateCount();
    pauseMedia();
    try { if (typeof window.PVKIT_PAUSE === 'function') window.PVKIT_PAUSE(); } catch (e) {}

    var n = BREAK_SEC;
    var numEl = document.getElementById('pvkNum');
    numEl.textContent = n;
    breakOvl.classList.add('on');
    breakId = setInterval(function () {
      n--;
      numEl.textContent = Math.max(0, n);
      if (n <= 0) endBreak();
    }, 1000);
  }

  function endBreak() {
    if (breakId) { clearInterval(breakId); breakId = null; }
    onBreak = false;
    timerPaused = false;
    breakOvl.classList.remove('on');
    resumeMedia();
    try { if (typeof window.PVKIT_RESUME === 'function') window.PVKIT_RESUME(); } catch (e) {}
  }

  function updateCount() {
    var left = BREAK_MAX - breaksUsed;
    if (countBadge) countBadge.textContent = left;
    if (breakBtn && left <= 0) {
      breakBtn.disabled = true;
      breakBtn.title = 'خلصت مرات التوقف المسموحة';
    }
  }

  /* ---------- المؤقت العام ---------- */
  function fmt(s) {
    var m = Math.floor(s / 60), r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }
  function startTimer() {
    stopTimer();
    timerId = setInterval(function () {
      if (timerPaused) return;
      timeLeft--;
      if (clock) {
        clock.textContent = fmt(Math.max(0, timeLeft));
        if (timeLeft <= 120) clock.classList.add('pvk-low');
      }
      if (timeLeft <= 0) {
        stopTimer();
        timeUp = true;
        try { if (typeof window.PVKIT_PAUSE === 'function') window.PVKIT_PAUSE(); } catch (e) {}
        pauseMedia();
        timeOvl.classList.add('on');
      }
    }, 1000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.PVKit = {
    goHome: goHome,
    startBreak: startBreak,
    endBreak: endBreak,
    pauseTimer: function () { timerPaused = true; },
    resumeTimer: function () { timerPaused = false; },
    stopTimer: stopTimer,
    breaksLeft: function () { return BREAK_MAX - breaksUsed; }
  };
})();
