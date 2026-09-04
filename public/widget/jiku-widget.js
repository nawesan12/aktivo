(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var businessSlug = script.getAttribute('data-business');

  if (!businessSlug) {
    console.error('[Jiku Widget] data-business attribute is required');
    return;
  }

  var baseUrl = script.src.replace('/widget/jiku-widget.js', '');

  var CALENDAR_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var CLOSE_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var POSITIONS = {
    'bottom-right': 'right:20px;bottom:20px;',
    'bottom-left': 'left:20px;bottom:20px;',
  };

  var HEX = /^#[0-9a-fA-F]{6}$/;
  function colorOr(value, fallback) {
    return HEX.test(value || '') ? value : fallback;
  }

  /**
   * The panel is the source of truth, not the snippet.
   *
   * Theme, position and colours used to be read off the script tag alone, so
   * changing any of them in the panel did nothing until the owner went back to
   * their website and pasted a new snippet — and turning the widget off did not
   * remove the button at all. The attributes stay as a fallback for when the
   * config request fails, which is the only case where showing the old button
   * beats showing none.
   */
  function config(callback) {
    var fallback = {
      theme: script.getAttribute('data-theme') || 'dark',
      position: script.getAttribute('data-position') || 'bottom-right',
      primaryColor: null,
      accentColor: null,
      enabled: true,
    };

    if (!window.fetch) return callback(fallback);

    fetch(baseUrl + '/api/widget/' + encodeURIComponent(businessSlug) + '/config')
      .then(function (response) {
        // 403 is the owner having turned the widget off. Anything else means we
        // could not ask, and the button stays as the page author configured it.
        if (response.status === 403) return callback({ enabled: false });
        if (!response.ok) return callback(fallback);
        return response.json().then(function (data) {
          callback({
            enabled: true,
            theme: data.theme || fallback.theme,
            position: data.position || fallback.position,
            primaryColor: colorOr(data.primaryColor, null),
            accentColor: colorOr(data.accentColor, null),
          });
        });
      })
      .catch(function () {
        callback(fallback);
      });
  }

  function mount(settings) {
    if (settings.enabled === false) return;

    var position = POSITIONS[settings.position] ? settings.position : 'bottom-right';
    var dark = settings.theme !== 'light';

    // The business's own colours. The button used to be indigo-and-cyan on
    // every site that embedded it: Jiku's brand on someone else's homepage.
    var primary = settings.primaryColor || '#6366F1';
    var accent = settings.accentColor || settings.primaryColor || '#22D3EE';

    var btn = document.createElement('button');
    btn.id = 'jiku-widget-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Reservar un turno');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = CALENDAR_ICON;
    btn.style.cssText =
      'position:fixed;z-index:99999;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.2s;' +
      POSITIONS[position];

    if (dark) {
      btn.style.background = 'linear-gradient(135deg, ' + primary + ', ' + accent + ')';
      btn.style.color = '#fff';
    } else {
      btn.style.background = '#fff';
      btn.style.color = primary;
      btn.style.border = '2px solid ' + primary;
    }

    btn.onmouseenter = function () {
      btn.style.transform = 'scale(1.1)';
    };
    btn.onmouseleave = function () {
      btn.style.transform = 'scale(1)';
    };

    var container = document.createElement('div');
    container.id = 'jiku-widget-container';
    container.style.cssText =
      'position:fixed;z-index:100000;width:400px;height:600px;max-width:95vw;max-height:90vh;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.4);display:none;' +
      POSITIONS[position];

    if (position === 'bottom-right') {
      container.style.right = '20px';
      container.style.bottom = '88px';
    } else {
      container.style.left = '20px';
      container.style.bottom = '88px';
    }

    // The iframe is created on first open, not on page load: embedding the
    // booking flow on every visit to the host site loaded a page nobody asked
    // for, and it is our function invocation that pays for it.
    var iframe = null;
    var isOpen = false;

    btn.onclick = function () {
      isOpen = !isOpen;

      if (isOpen && !iframe) {
        iframe = document.createElement('iframe');
        iframe.src = baseUrl + '/embed/' + encodeURIComponent(businessSlug);
        iframe.title = 'Reservá tu turno';
        iframe.style.cssText = 'width:100%;height:100%;border:none;';
        iframe.allow = 'payment';
        container.appendChild(iframe);
      }

      container.style.display = isOpen ? 'block' : 'none';
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      btn.innerHTML = isOpen ? CLOSE_ICON : CALENDAR_ICON;
    };

    // Escape closes it, the way every other overlay on the web does.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen) btn.onclick();
    });

    document.body.appendChild(btn);
    document.body.appendChild(container);
  }

  function start() {
    config(mount);
  }

  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start);
  }
})();
