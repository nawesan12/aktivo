(function() {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var businessSlug = script.getAttribute('data-business');
  var theme = script.getAttribute('data-theme') || 'dark';
  var position = script.getAttribute('data-position') || 'bottom-right';

  if (!businessSlug) {
    console.error('[Jiku Widget] data-business attribute is required');
    return;
  }

  var baseUrl = script.src.replace('/widget/jiku-widget.js', '');

  // Create floating button
  var btn = document.createElement('button');
  btn.id = 'jiku-widget-btn';
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

  var positions = {
    'bottom-right': 'right:20px;bottom:20px;',
    'bottom-left': 'left:20px;bottom:20px;',
  };

  btn.style.cssText = 'position:fixed;z-index:99999;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.2s;' + (positions[position] || positions['bottom-right']);

  if (theme === 'dark') {
    btn.style.background = 'linear-gradient(135deg, #6366F1, #22D3EE)';
    btn.style.color = '#fff';
  } else {
    btn.style.background = '#fff';
    btn.style.color = '#6366F1';
    btn.style.border = '2px solid #6366F1';
  }

  btn.onmouseenter = function() { btn.style.transform = 'scale(1.1)'; };
  btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; };

  // Create iframe container
  var container = document.createElement('div');
  container.id = 'jiku-widget-container';
  container.style.cssText = 'position:fixed;z-index:100000;width:400px;height:600px;max-width:95vw;max-height:90vh;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.4);display:none;' + (positions[position] || positions['bottom-right']);

  // Adjust position to be above button
  if (position === 'bottom-right') {
    container.style.right = '20px';
    container.style.bottom = '88px';
  } else {
    container.style.left = '20px';
    container.style.bottom = '88px';
  }

  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/embed/' + businessSlug;
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.allow = 'payment';
  container.appendChild(iframe);

  var isOpen = false;
  btn.onclick = function() {
    isOpen = !isOpen;
    container.style.display = isOpen ? 'block' : 'none';
    btn.innerHTML = isOpen
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  };

  document.body.appendChild(btn);
  document.body.appendChild(container);
})();
