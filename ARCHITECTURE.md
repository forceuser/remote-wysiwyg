# Project Structure & Architecture

## Overview

**remote-wysiwyg** is a browser-based WYSIWYG HTML/Markdown editor that runs remotely (in a popup or iframe) and communicates with a parent window via `postMessage` API. It combines TinyMCE for visual editing and Ace Editor for source code editing.

## Directory Structure

```
remote-wysiwyg/
├── dist/                      # Built output
│   ├── css/                   # Compiled CSS files
│   │   ├── wysiwyg.css/min    # Editor styles
│   │   ├── code-editor.css/min # Ace editor styles
│   │   └── wisywig-content.css/min # Content area styles
│   ├── js/                    # Compiled JavaScript bundles
│   │   ├── wysiwyg.js         # Main editor bundle
│   │   └── code-editor.js     # Code editor bundle
│   ├── wysiwyg.html           # Editor entry point
│   ├── code-editor.html       # Code editor iframe
│   └── index.html             # Launcher demo
│
├── src/
│   ├── js/                    # Source JavaScript
│   │   ├── wysiwyg.js         # Main editor entry point
│   │   ├── code-editor.js     # Ace editor wrapper
│   │   ├── fullpage.js        # TinyMCE fullpage plugin (custom)
│   │   ├── selection-man.js   # Selection save/restore utility
│   │   └── turndown-github-alerts.js # Markdown conversion plugin
│   ├── less/                  # Stylesheets
│   │   ├── wysiwyg.less       # Main editor styles
│   │   ├── code-editor.less   # Code editor styles
│   │   ├── wisywig-content.less # Content area styles
│   │   ├── reset.less         # CSS reset
│   │   ├── scrollbar.less     # Custom scrollbar styles
│   │   └── markdown.css       # Markdown-specific styles
│   └── templates/             # HTML templates
│       ├── wysiwyg.html       # Main editor template
│       ├── code-editor.html   # Code editor template
│       └── index.html         # Launcher demo template
│
├── webpack/                   # Webpack configuration
│   ├── base.config.js         # Shared webpack config
│   ├── development.config.js  # Development build
│   └── production.config.js   # Production build
│
├── polyfill/                  # Browser polyfills
│   ├── all.js                 # Polyfill bundle
│   ├── custom-elements.min.js # Web Components polyfill
│   └── native-shim.js         # Native shim for CE
│
├── build-utils/               # Build scripts
│   ├── dev-server.js          # Development server
│   ├── build-templates.js     # Template builder
│   ├── build-sprites.js       # SVG sprite builder
│   ├── create-package.js      # Package creation
│   └── commit.js              # Release automation
│
└── package.json               # Project configuration
```

## Architecture

### Communication Pattern

```
┌─────────────────┐         postMessage          ┌─────────────────┐
│   Parent Window │ ◄─────────────────────────► │   Editor Window │
│ (remote-wysiwyg │                             │   (wysiwyg.html)│
│      -ctrl)     │                             │                 │
└─────────────────┘                             └────────┬────────┘
                                                         │
                                                         │ iframe
                                                         ▼
                                                ┌─────────────────┐
                                                │  Code Editor    │
                                                │(code-editor.html│
                                                │    + Ace)       │
                                                └─────────────────┘
```

### Message Protocol

| Message Type | Direction | Description |
|-------------|-----------|-------------|
| `preinit` | Editor → Parent | Signals editor is ready for init |
| `init` | Parent → Editor | Sends initial configuration |
| `initialized` | Editor → Parent | Confirms editor is ready |
| `save` | Parent → Editor | Request to save content |
| `cancel` | Parent → Editor | Request to close editor |
| `changemode` | Parent → Editor | Change code mode (html/markdown/handlebars/freemarker) |
| `setColorScheme` | Parent → Editor | Set color scheme (light/dark) |
| `settings` | Parent → Editor | Apply runtime settings |

### Core Components

#### 1. Main Editor (wysiwyg.js)

Entry point that orchestrates the entire editor:
- Parses URL parameters for initialization
- Sets up `postMessage` communication with parent window
- Initializes TinyMCE with appropriate plugins
- Creates code sidebar with embedded Ace editor
- Handles paste sanitization
- Synchronizes content between WYSIWYG and code views

#### 2. Code Editor (code-editor.js)

Ace editor wrapper supporting multiple modes:
- **html** - Standard HTML
- **markdown** - Markdown with GFM support
- **handlebars** - Handlebars templates
- **freemarker** - FreeMarker templates

#### 3. Fullpage Plugin (fullpage.js)

Custom TinyMCE plugin for full document editing:
- Supports 3 page modes:
  - `body` - Only document body
  - `html` - Full HTML document
  - `xhtml` - Full XHTML document
- Manages document head, meta tags, stylesheets

#### 4. Selection Manager (selection-man.js)

Cross-browser selection save/restore utility:
- `saveSelection()` / `restoreSelection()` - Range-based
- `saveAbsSelection()` / `restoreAbsSelection()` - Character offset-based

### Content Processing

```
┌─────────────┐     Markdown-it      ┌─────────────┐
│   Markdown  │ ─────────────────► │    HTML     │
└─────────────┘                     └──────┬──────┘
                                           │
       ▲                                   │ TinyMCE
       │                                   │ Editing
       │ Turndown                          ▼
       │                            ┌─────────────┐
       └─────────────────────────── │   Sanitized │
                                    │    HTML     │
                                    └─────────────┘
```

### Styling Architecture

- **wysiwyg.less** - Editor chrome, toolbar, panels
- **code-editor.less** - Ace editor container
- **wisywig-content.less** - Content area (inside iframe)
- **reset.less** - CSS normalization
- **scrollbar.less** - Custom scrollbar styling

### Build System

1. **JavaScript**: Webpack 4 with Babel
   - Entry points: `wysiwyg.js`, `code-editor.js`
   - Output: UMD bundles in `dist/js/`
   
2. **CSS**: Less → PostCSS (autoprefixer) → CleanCSS
   - Source: `src/less/`
   - Output: `dist/css/` (both regular and minified)

3. **Templates**: Copied to `dist/` with Mustache processing

### Editor Modes

| Mode | WYSIWYG Features | Code Highlighting |
|------|-----------------|-------------------|
| html | Full (tables, colors, fullpage) | HTML |
| markdown | Limited (headers, inline, blocks) | Markdown |
| handlebars | Full | Handlebars |
| freemarker | Full | FreeMarker |

## Dependencies

### Runtime
- **tinymce** - WYSIWYG editor engine
- **brace** (Ace) - Code editor
- **markdown-it** - Markdown to HTML
- **turndown** - HTML to Markdown
- **sanitize-html** - Input sanitization
- **pretty** - HTML formatting

### Build
- **webpack** - Module bundler
- **babel** - JavaScript transpilation
- **less** - CSS preprocessing
- **postcss/autoprefixer** - CSS vendor prefixes

## Usage

### Standalone
Open `dist/wysiwyg.html` directly in browser.

### With Controller (remote-wysiwyg-ctrl)
```javascript
wysiwyg('./wysiwyg.html', {
    content: '<p>Initial content</p>',
    color: '#275fa6',
    settings: {
        menubar: true,
        topbar: true,
        statusbar: false,
        codeMode: 'html',
        saveOnChange: false
    }
}).then(ctrl => {
    ctrl.onSave = (content) => {
        console.log('Saved:', content);
    };
});
```
