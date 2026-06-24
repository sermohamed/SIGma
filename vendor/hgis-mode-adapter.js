/* global window */
(function (global) {
  'use strict';

  function wireModeAdapter(config) {
    if (!config || !config.td) return;

    var td = config.td;
    var wasInSelectMode = false;

    function syncGesturesToMode() {
      try {
        var mode = td && typeof td.getMode === 'function' ? td.getMode() : 'static';
        var isDrawing = mode && mode !== 'static' && mode !== 'select';
        config.setDoubleClickZoom(!isDrawing);

        if (mode !== 'linestring' && mode !== 'polygon'
            && mode !== 'rectangle' && mode !== 'circle') {
          config.clearFirstVertex();
        }

        var isInSelectMode = (mode === 'select');
        if (wasInSelectMode !== isInSelectMode) {
          config.hudLog('mode: ' + (isInSelectMode ? '→ select' : '← left select'));
        }
        if (wasInSelectMode && !isInSelectMode) {
          config.resetSelectEditFlags();
          config.hudLog('left select → keep selection');
        }
        wasInSelectMode = isInSelectMode;
      } catch (_) {}
    }

    if (typeof config.onModeChanged === 'function') {
      try { config.onModeChanged(syncGesturesToMode); } catch (_) {}
    }
    if (td && typeof td.on === 'function') {
      td.on('change', syncGesturesToMode);
    }
    syncGesturesToMode();
  }

  global.HGISWireModeAdapter = wireModeAdapter;
})(window);
