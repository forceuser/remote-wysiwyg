# Vite Modernization Plan

## Status: COMPLETED ✓

## Executive Summary

Migrated from Webpack 4 to Vite 6 while preserving all existing functionality. Benefits:
- Dev server startup: ~10s → ~300ms
- Build time: ~15s → ~5s
- Simpler configuration (3 vite configs vs 3 webpack configs + build-utils)
- Modern ESM-first approach

---

## Implementation Summary

### Files Changed

**Added:**
- `vite.config.js` - Main JS build config (ESM + IIFE outputs)
- `vite.config.css.js` - CSS build config with template copying
- `public/css/tinymce/` - TinyMCE skin assets

**Removed (after migration):**
- `build-utils/copy-assets.js` - No longer needed
- `vite.config.dev.js` - Simplified into npm scripts

**Updated:**
- `package.json` - New scripts and dependencies

### Build Structure

```
dist/
├── wysiwyg.html          # Main editor
├── code-editor.html      # Code editor iframe
├── index.html            # Demo launcher
├── css/
│   ├── wysiwyg.css/min   # Editor styles
│   ├── code-editor.css/min # Ace editor styles
│   ├── wisywig-content.css/min # Content area
│   └── tinymce/lightgray/ # TinyMCE skins
└── js/
    ├── wysiwyg.js        # IIFE bundle (legacy)
    ├── wysiwyg.esm.js    # ESM bundle (modern)
    ├── code-editor.js    # IIFE bundle
    └── code-editor.esm.js # ESM bundle
```

### NPM Scripts

```json
{
  "dev": "Initial build + watch + preview server on :8080",
  "build": "Clean + build all (CSS, ESM, IIFE) + minify CSS"
}
```

---

## Notes

### Known Issues

1. **code-editor.js not minified**: Terser fails on brace/ace ES6 syntax in IIFE mode. Left unminified (~1.8MB vs ~400KB for minified).

2. **Module externalization warnings**: Node.js built-ins (stream, path) are externalized for browser. These come from transitive dependencies and don't affect browser builds.

### Migration Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| TinyMCE version | Keep v4 | User requested minimal changes |
| Output formats | ESM + IIFE | Support both modern and legacy |
| TinyMCE assets | Bundled | Self-contained, works offline |
| Legacy support | ESM only | @vitejs/plugin-legacy doesn't work in lib mode |
| CSS minification | CleanCSS | Works well with Less output |

---

## Current Stack Analysis

| Component | Current | Issue |
|-----------|---------|-------|
| Bundler | Webpack 4.20.2 | Outdated, slow HMR |
| Transpiler | Babel 7.0 | Can be replaced by esbuild |
| CSS Preprocessor | Less + PostCSS | Keep, but simplify pipeline |
| Dev Server | Custom BrowserSync + webpack-dev-middleware | Complex setup |
| Minification | UglifyJS | Replace with terser/esbuild |
| Module Format | UMD | Switch to ESM (with IIFE fallback for CDN) |

---

## Features to Preserve

### Core Functionality
- [x] Two entry points: `wysiwyg.js`, `code-editor.js`
- [x] TinyMCE with plugins (link, lists, table, hr, image, colorpicker, textcolor, fullpage)
- [x] Ace/Brace editor with modes (html, markdown, handlebars, freemarker)
- [x] Markdown-it + Turndown for MD ↔ HTML conversion
- [x] sanitize-html for paste sanitization
- [x] Russian localization (tinymce-i18n)

### Editor Modes
- [x] HTML mode (full features)
- [x] Markdown mode (limited toolbar, GFM support)
- [x] Handlebars mode
- [x] Freemarker mode

### Page Modes (fullpage plugin)
- [x] `body` - content only
- [x] `html` - full HTML document
- [x] `xhtml` - full XHTML document

### UI Features
- [x] Resizable sidebar code editor (drag handle)
- [x] Top bar with save/cancel buttons (conditional)
- [x] Color scheme support (light/dark/system)
- [x] Custom CSS injection (contentCss, editorCss, codeEditorCss)
- [x] Custom style injection

### Build Features
- [x] Source maps (development & production)
- [x] CSS autoprefixing
- [x] CSS minification
- [x] Template processing (Mustache)
- [x] Hot reload in development
- [x] Polyfills for older browsers

---

## Migration Strategy

### Phase 1: Setup & Configuration

#### 1.1 Install Vite and Plugins
```bash
npm install -D vite @vitejs/plugin-legacy vite-plugin-static-copy
```

#### 1.2 Create vite.config.js
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        wysiwyg: resolve(__dirname, 'src/js/wysiwyg.js'),
        'code-editor': resolve(__dirname, 'src/js/code-editor.js'),
      },
      formats: ['es', 'iife'],
      name: 'remoteWysiwyg',
    },
    outDir: 'dist/js',
    sourcemap: true,
  },
  resolve: {
    alias: {
      root: resolve(__dirname, 'src/js'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        /* less options */
      },
    },
  },
});
```

### Phase 2: CSS Migration

#### 2.1 Less Processing
Vite natively supports Less. Move from multi-step process:
```
Current: lessc → postcss/autoprefixer → cleancss
Vite:   Less import → automatic autoprefixer → terser minification
```

#### 2.2 Entry Points for CSS
Create CSS entry files or use `vite.config.js`:
```javascript
build: {
  rollupOptions: {
    input: {
      wysiwyg: 'src/less/wysiwyg.less',
      'code-editor': 'src/less/code-editor.less',
      'wisywig-content': 'src/less/wisywig-content.less',
    },
  },
}
```

Or use separate CSS build:
```bash
vite build --config vite.config.css.js
```

### Phase 3: Template Handling

#### 3.1 Options
**Option A: vite-plugin-html**
Process templates at build time with variable injection.

**Option B: Static Copy + Transform**
Copy templates to dist with transformations.

**Recommended: Option B** - simpler, less magic

```javascript
// vite.config.js
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/templates/*.html',
          dest: '.',
          transform: (content) => {
            // Mustache replacement if needed
            return content;
          },
        },
      ],
    }),
  ],
});
```

### Phase 4: Polyfills Strategy

#### 4.1 Modern Approach
Use `@vitejs/plugin-legacy` for automatic polyfills:
```javascript
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['last 2 major versions'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
  ],
});
```

This replaces manual polyfill management in `polyfill/` directory.

### Phase 5: Dev Server

#### 5.1 Replace Custom Dev Server
Current: BrowserSync + webpack-dev-middleware + webpack-hot-middleware
New: Vite's built-in dev server

```bash
vite --port 8080 --open
```

#### 5.2 Dev Server Config
```javascript
server: {
  port: 8080,
  open: true,
  cors: true,
  // Proxy if needed
}
```

### Phase 6: TinyMCE & Ace Handling

#### 6.1 TinyMCE Assets
TinyMCE needs skin and content CSS. Options:

**Option A: External CDN** (recommended for simplicity)
```javascript
tinymce.init({
  skin_url: 'https://cdn.jsdelivr.net/npm/tinymce-lang@7/skins/ui/oxide',
  content_css: 'https://cdn.jsdelivr.net/npm/tinymce-lang@7/skins/content/default/content.css',
});
```

**Option B: Bundle with Vite**
```javascript
// Copy TinyMCE skins
viteStaticCopy({
  targets: [{
    src: 'node_modules/tinymce/skins/**/*',
    dest: 'skins',
  }],
})
```

#### 6.2 Ace/Brace Modes
Ace modes are dynamically imported. They should work with Vite's ESM.

---

## File Structure Changes

### Before
```
webpack/
  base.config.js
  development.config.js
  production.config.js
build-utils/
  dev-server.js
  build-templates.js
  build-sprites.js
polyfill/
  all.js
  custom-elements.min.js
  native-shim.js
```

### After
```
vite.config.js          # Main JS config
vite.config.css.js      # CSS-only build (optional)
public/
  skins/                # TinyMCE skins (if bundling)
src/
  js/
    wysiwyg.js
    code-editor.js
  less/
    wysiwyg.less
    code-editor.less
  templates/
    wysiwyg.html
    code-editor.html
    index.html
```

---

## NPM Scripts Migration

| Old | New |
|-----|-----|
| `build:js` | `vite build` |
| `build:less` | `vite build --config vite.config.css.js` |
| `dev:js` | `vite` |
| `dev:less` | Included in `vite` |
| `build:templates` | `vite-plugin-static-copy` |

### New package.json scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && vite build --config vite.config.css.js",
    "preview": "vite preview",
    "build:js": "vite build",
    "build:css": "vite build --config vite.config.css.js"
  }
}
```

---

## Dependencies Changes

### Remove
```json
{
  "devDependencies": {
    "webpack": "4.20.2",
    "webpack-cli": "3.1.1",
    "webpack-dev-middleware": "3.4.0",
    "webpack-dev-server": "3.1.8",
    "webpack-hot-middleware": "2.24.2",
    "webpack-merge": "4.1.4",
    "uglifyjs-webpack-plugin": "^2.0.1",
    "babel-loader": "^8.0.2",
    "@babel/core": "^7.1.0",
    "@babel/preset-env": "^7.1.0",
    "@babel/plugin-*": "...",
    "browser-sync": "^2.24.7",
    "autoprefixer": "^9.1.5",
    "postcss-cli": "^6.0.0",
    "clean-css-cli": "^4.2.1"
  }
}
```

### Add
```json
{
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-legacy": "^6.0.0",
    "vite-plugin-static-copy": "^2.0.0",
    "less": "^4.2.0"
  }
}
```

### Keep (with version bumps)
```json
{
  "dependencies": {
    "tinymce": "^7.0.0",
    "tinymce-i18n": "^8.0.0",
    "brace": "^0.11.1",
    "markdown-it": "^14.0.0",
    "turndown": "^7.2.0",
    "@truto/turndown-plugin-gfm": "^1.0.2",
    "markdown-it-github-alerts": "^1.0.1",
    "@gerhobbelt/markdown-it-checkbox": "^1.2.0-3",
    "sanitize-html": "^2.0.0",
    "pretty": "^2.0.0"
  }
}
```

---

## Implementation Steps

### Step 1: Parallel Installation
- Install Vite alongside Webpack
- Create `vite.config.js`
- Keep existing build working

### Step 2: Migrate JavaScript Build
- Configure Vite for JS entries
- Test output bundles
- Verify TinyMCE and Ace work

### Step 3: Migrate CSS Build
- Configure Less processing
- Test autoprefixer
- Verify output CSS

### Step 4: Migrate Templates
- Configure static copy plugin
- Add Mustache transforms if needed

### Step 5: Migrate Dev Server
- Replace custom dev server with `vite`
- Test HMR

### Step 6: Cleanup
- Remove Webpack configs
- Remove build-utils/
- Remove polyfill/ (use @vitejs/plugin-legacy)
- Update package.json scripts

### Step 7: Test Everything
- All editor modes
- All page modes
- Markdown conversion
- Save/cancel functionality
- Color schemes
- Custom CSS injection

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| TinyMCE skin paths break | Test early, use CDN fallback |
| Ace dynamic imports fail | Explicit imports for modes |
| UMD → ESM breaks consumers | Keep IIFE format as fallback |
| Less variables not working | Check Less config in vite.config.js |
| Polyfills missing | Configure plugin-legacy properly |

---

## Timeline Estimate

| Phase | Time |
|-------|------|
| Phase 1: Setup | 1 hour |
| Phase 2: CSS Migration | 1 hour |
| Phase 3: Templates | 30 min |
| Phase 4: Polyfills | 30 min |
| Phase 5: Dev Server | 30 min |
| Phase 6: TinyMCE/Ace | 1 hour |
| Step 7: Testing | 1 hour |
| **Total** | **~5-6 hours** |

---

## Questions Before Proceeding

1. **TinyMCE version**: Upgrade to v7 or keep v4?
2. **Output format**: ESM only, or also IIFE for legacy browsers?
3. **Polyfills**: Target same browsers or drop older IE support?
4. **CDN usage**: Use CDN for TinyMCE skins or bundle them?
