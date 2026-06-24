/* global window */
(function (global) {
  'use strict';

  function wireSelectionAdapter(config) {
    if (!config || !config.map || !config.td) return;

    var map = config.map;
    var td = config.td;
    var state = config.state;

    var lastTapPx = null;
    var lastTapStackIds = [];
    var lastTapCycleIdx = 0;
    var tapDown = null;
    var suppressNextClick = false;

    function findStoreFeatureByTerraId(terraId) {
      return (state.features || []).find(function (f) {
        return f.geojson && f.geojson.properties &&
          config.terraIdMatch(f.geojson.properties._terraId, terraId);
      });
    }

    function handleSelectionAtPoint(point) {
      try {
        var mode = 'static';
        try {
          if (td && typeof td.getMode === 'function') {
            var m = td.getMode();
            if (m) mode = m;
          }
        } catch (_) {}
        if (mode !== 'select') return;

        var layers = ['td-point', 'td-linestring', 'td-polygon', 'td-polygon-outline',
          'app-derived-point', 'app-derived-line', 'app-derived-fill']
          .filter(function (id) { return map.getLayer(id); });
        if (layers.length === 0) return;
        var hits = map.queryRenderedFeatures(point, { layers: layers });

        var ourIds = [];
        (hits || []).forEach(function (hit) {
          var propId = hit.properties && hit.properties.id;
          var ours = (state.features || []).find(function (f) { return propId && f.id === propId; });
          if (!ours && hit.id != null) {
            ours = findStoreFeatureByTerraId(hit.id);
          }
          if (ours && !ourIds.includes(ours.id)) ourIds.push(ours.id);
        });

        if (ourIds.length === 0) {
          if (!state.multiSelectMode && state.selectedIds.length > 0) {
            state.selectedIds = [];
            config.notifyUi();
          }
          return;
        }

        var curPx = [point.x, point.y];
        var samePlace = lastTapPx &&
          Math.abs(lastTapPx[0] - curPx[0]) < 10 &&
          Math.abs(lastTapPx[1] - curPx[1]) < 10 &&
          lastTapStackIds.length === ourIds.length &&
          lastTapStackIds.every(function (id, i) { return id === ourIds[i]; });

        if (!samePlace) {
          lastTapPx = curPx;
          lastTapStackIds = ourIds.slice();
          lastTapCycleIdx = 0;
        } else {
          lastTapCycleIdx = (lastTapCycleIdx + 1) % ourIds.length;
        }

        var pickedId = ourIds[lastTapCycleIdx];
        config.selectFeature(pickedId, { additive: state.multiSelectMode });
        if (typeof config.forceYellowHalo === 'function') {
          try { config.forceYellowHalo(); } catch (_) {}
        }
      } catch (err) {
        config.log.warn('[HydraulicGIS] tap failed:', err);
      }
    }

    // Cross-device reliable tap handling (desktop + Android + iPhone):
    // use pointerup on canvas with movement threshold, then fall back to click.
    var canvas = map.getCanvas && map.getCanvas();
    if (canvas && canvas.addEventListener) {
      canvas.addEventListener('pointerdown', function (ev) {
        if (!ev.isPrimary) return;
        tapDown = { x: ev.clientX, y: ev.clientY };
      }, true);

      canvas.addEventListener('pointerup', function (ev) {
        if (!ev.isPrimary || !tapDown) return;
        var dx = ev.clientX - tapDown.x;
        var dy = ev.clientY - tapDown.y;
        tapDown = null;
        if (Math.sqrt(dx * dx + dy * dy) > 8) return;
        try {
          var rect = canvas.getBoundingClientRect();
          handleSelectionAtPoint({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });
          suppressNextClick = true;
          setTimeout(function () { suppressNextClick = false; }, 250);
        } catch (_) {}
      }, true);
    }

    map.on('click', function (e) {
      if (suppressNextClick) return;
      handleSelectionAtPoint(e.point);
    });
  }

  global.HGISWireSelectionAdapter = wireSelectionAdapter;
})(window);
