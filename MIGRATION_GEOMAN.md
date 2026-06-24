# Geoman Migration (Phase 1)

This repository now supports an experimental Geoman runtime path while preserving the current TerraDraw path.

## Current status

- Default engine: `terradraw`
- Experimental engine: `geoman` (opt-in)
- Toggle: add `?drawEngine=geoman` to the app URL

Example:

- `http://localhost:3000/?drawEngine=geoman`

The selected engine is saved in `localStorage` under:

- `hydraulic-gis:draw-engine`

## What was added in phase 1

- Draw-engine selector (`terradraw` or `geoman`)
- Geoman dynamic loader via ESM CDN
- Geoman CSS runtime injection
- Compatibility bridge exposing TerraDraw-like methods used by the app:
  - `on(...)`
  - `getMode()`
  - `setMode(...)`
  - `getSnapshot()`
  - `addFeatures(...)`
  - `removeFeatures(...)`
  - `selectFeature(...)`
  - `deselect()`

## Install command (if switching to npm-managed assets later)

```bash
npm install @geoman-io/maplibre-geoman-free
```

## Next phases

1. Replace TerraDraw-only UI wiring (toolbar/edit button assumptions) with engine-agnostic controls.
2. Replace TerraDraw layer-id assumptions (`td-*`) in selection/visibility paths.
3. Make Geoman the default engine after cross-device validation (desktop + Samsung + iPhone).
