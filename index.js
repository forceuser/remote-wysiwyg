import Markdown from "markdown-it";
import Turndown from "turndown";
// import {gfm} from "turndown-plugin-gfm";

import tinymce from "tinymce/tinymce";
// theme
import "tinymce/themes/modern/theme";
// plugins
import "tinymce/plugins/contextmenu";
import "tinymce/plugins/paste";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/table";


import "tinymce/plugins/code";
import "tinymce/plugins/codesample";
import "tinymce/plugins/colorpicker";
import "tinymce/plugins/textcolor";
import "tinymce/plugins/hr";
import "tinymce/plugins/image";
import "tinymce/plugins/imagetools";

import "tinymce-i18n/langs/ru";

import "./fullpage";

// import {html as beautify} from "js-beautify";
import pretty from "pretty";

let inititalized = false;
const masterWindow = (window.opener || window.parent);

const params = window.location.search.substring(1).split("&").reduce((res, i) => {
	if (i.split("=")[0]) {
		let val = i.split("=")[1];
		val = val == null ? true : val;
		res[i.split("=")[0]] = val;
	}
	return res;
}, {});

let editors;
if (params.init && masterWindow) {
	window.addEventListener("message", event => {
		if (event.data) {
			const data = JSON.parse(event.data);
			if (data.id === params.init) {
				if (data.type === "init" && !inititalized) {
					init(data.data).then(ed => {
						masterWindow.postMessage(JSON.stringify({type: `initialized`, id: params.init}), "*");
						editors = ed;
					});
				}
				if (data.type === "save") {
					editors && editors.ctrl.save();
				}
				if (data.type === "cancel") {
					editors && editors.ctrl.cancel();
				}
				if (data.type === "changemode") {
					editors && editors.ctrl.changemode(data.mode);
				}
				if (data.type === "settings") {
					editors && editors.ctrl.settings(data.data);
				}
			}
		}
	});

	masterWindow.postMessage(JSON.stringify({type: `preinit`, id: params.init}), "*");
}
else {
	init();
}

function init ({color = "#275fa6", content = "", settings = {}, callbackId} = {}) {
	return new Promise(resolve => {
		const colorPrimary = color;
		let markdown;
		let turndown;
		inititalized = true;
		settings = Object.assign({ // default settings
			codeMode: "html",
			topbar: params.init && masterWindow,
			menubar: true,
			statusbar: true,
		}, settings);
		if (settings.codeMode === "markdown") {
			markdown = new Markdown();
			turndown = new Turndown();
			// turndown.use(gfm);
		}

		if (!settings.topbar) {
			const topbar = document.querySelector(".editor-wrapper-menu");
			topbar.parentElement.removeChild(topbar);
		}

		document.documentElement.style.setProperty("--color--primary", colorPrimary);
		const isMD = settings.codeMode === "markdown";
		const defaultToolbar = `undo redo | styleselect | bold italic | alignleft
		                   aligncenter alignright alignjustify |
		                   bullist numlist outdent indent | link image`;

		const formatMenuMD = [
			{title: "Headers", items: [
				{title: "Header 1", format: "h1"},
				{title: "Header 2", format: "h2"},
				{title: "Header 3", format: "h3"},
				{title: "Header 4", format: "h4"},
				{title: "Header 5", format: "h5"},
				{title: "Header 6", format: "h6"},
			]},
			{title: "Inline", items: [
				{title: "Bold", icon: "bold", format: "bold"},
				{title: "Italic", icon: "italic", format: "italic"},
			]},
			{title: "Blocks", items: [
				{title: "Blockquote", format: "blockquote"},
				{title: "Code", format: "code"},
			]},
			{title: "Clear formatting", format: "removeformat"},
		];


		const tinymceSettings = Object.assign({},
			isMD
				? {
					object_resizing: false,
					image_dimensions: false,
					toolbar: `undo redo | styleselect | bold italic | bullist numlist | link image hr`,
					plugins: [
						"contextmenu", "paste", "link", "lists", "hr", "image",
					],
					menu: {
						edit: {title: "Edit", items: "undo redo | cut copy paste pastetext | selectall"},
						insert: {title: "Insert", items: "link image hr"},
						view: {title: "View", items: "visualaid"},
					},
					style_formats: formatMenuMD,
				}
				: {
					plugins: [
						"contextmenu", "fullpage",
						"paste", "link", "lists", "table",
						"colorpicker", "textcolor", "hr", "image", "imagetools",
					],
					toolbar: `${defaultToolbar} | forecolor backcolor`,
					table_toolbar: false,
					valid_elements: "+*[*]",
					valid_children: "+body[style]",
					object_resizing: false,
				},
			{
				content_style: `:root{--color--primary: ${colorPrimary};}`,
				content_css: ["./css/frame.css", "./css/scrollbar.css"],
				menubar: settings.menubar,
				statusbar: settings.statusbar,
				selector: "#wysiwyg",
				language: "ru",
				relative_urls: false,
				remove_script_host: false,
				force_p_newlines: true,
				force_br_newlines: true,
				remove_linebreaks: false,
				forced_root_block: false,
				branding: false,
				setup,
				init_instance_callback (editor) {
					editor.on("paste", (e) => {
						if (isMD) {
							editor.setContent(markdown.render(turndown.turndown(editor.getContent())));
						}
					});
				},
			}
		);
		if (isMD) {
			// tinymceSettings.content_css.push("./css/markdown.css");
		}

		function setup (editor) {
			editor.hasVisual = false;
			editor.addSidebar("codebar", {
				tooltip: "Code sidebar",
				icon: "code",
				classes: "code-btn",
				async onrender (api) {
					const panel = api.element();
					panel.classList.add("code-editor-panel");
					panel.innerHTML = `<iframe id="code-editor" src="./code-editor.html"></iframe>`;
					const iframe = panel.children[0];
					const codeEditor = await (new Promise(resolve => {
						const inerv = setInterval(() => {
							if (iframe.contentWindow && iframe.contentWindow.editor) {
								clearInterval(inerv);
								iframe.contentWindow.setMode(settings.codeMode);
								resolve(iframe.contentWindow.editor);
							}
						}, 100);
					}));
					const wysiwyg_ifr = document.querySelector("#wysiwyg_ifr");


					const ctrl = {
						save (close = false) {
							masterWindow.postMessage(JSON.stringify({
								type: "save",
								close,
								id: callbackId,
								content: codeEditor.getValue(),
							}), "*");
						},
						cancel () {
							window.close();
						},
						changemode (mode) {
							iframe.contentWindow.setMode(mode);
						},
						settings (data = {}) {
							const customCssClass = "customcss-" + btoa(Math.random()).replace(/\=/ig, "");
							const customStyleClass = "customstyle-" + btoa(Math.random()).replace(/\=/ig, "");
							function addCssToDocument (document, css) {
								const tmp = document.createElement("div");
								[...document.querySelectorAll(`.${customCssClass}`)].forEach(link => {
									link.parentNode.removeChild(link);
								});
								const head = document.querySelector("head");
								[].concat(css).forEach(link => {
									tmp.innerHTML = `<link rel="stylesheet" type="text/css" class="${customCssClass}" href="${link}">`;
									head.appendChild(tmp.firstChild);
								});
							}
							function addStyleToDocument (document, style) {
								const tmp = document.createElement("div");
								[...document.querySelectorAll(`.${customStyleClass}`)].forEach(link => {
									link.parentNode.removeChild(link);
								});
								const head = document.querySelector("head");
								[].concat(style).forEach(style => {
									tmp.innerHTML = `<style class="${customStyleClass}">${style}</style>`;
									head.appendChild(tmp.firstChild);
								});
							}

							if (data.contentCss) {
								addCssToDocument(wysiwyg_ifr.iframe.contentWindow.document, data.contentCss);
							}
							if (data.editorCss) {
								addCssToDocument(document, data.editorCss);
							}
							if (data.contentStyle) {
								addStyleToDocument(wysiwyg_ifr.iframe.contentWindow.document, data.contentStyle);
							}
							if (data.editorStyle) {
								addStyleToDocument(document, data.editorStyle);
							}
							if (data.theme) {
								iframe.contentWindow.setTheme(data.theme);
							}
						},
					};

					if (masterWindow && params.init) {
						if (settings.topbar) {
							document.querySelector(".button-ok").addEventListener("click", () => ctrl.save(true));
							document.querySelector(".button-cancel").addEventListener("click", () => ctrl.cancel());
						}
						window.addEventListener("beforeunload", () => {
							masterWindow.postMessage(JSON.stringify({
								type: "cancel",
								id: callbackId,
							}), "*");
						});
					}


					iframe.contentWindow.document.documentElement.style.setProperty("--color--primary", colorPrimary);
					codeEditor.$blockScrolling = Infinity;
					let ignoreInput = false;
					let ignoreInputTimeout;
					function toWysiwyg (content) {
						editor.settings.modifyingCode = true;
						if (settings.codeMode === "markdown") {
							editor.setContent(markdown.render(content));
						}
						else {
							editor.setContent(content);
						}
						editor.settings.modifyingCode = false;
					}

					function updateCodeEditor () {
						clearTimeout(ignoreInputTimeout);
						ignoreInput = true;
						const pos = codeEditor.session.selection.toJSON();
						if (settings.codeMode === "markdown") {
							codeEditor.session.setValue(turndown.turndown(editor.getContent()));
						}
						else {
							codeEditor.session.setValue(pretty(editor.getContent(), {"indent-with-tabs": true, "indent_char": "\t", indent_size: 1}));
						}
						codeEditor.session.selection.fromJSON(pos);
						if (settings.saveOnChange) {
							ctrl.save();
						}
						ignoreInputTimeout = setTimeout(() => {
							ignoreInput = false;
						}, 50);
					}

					codeEditor.on("input", () => {
						if (ignoreInput) {
							return;
						}
						toWysiwyg(codeEditor.getValue());
					});
					let lastContent = "";
					setInterval(() => {
						if (document.activeElement !== iframe) {
							const content = editor.getContent();
							if (lastContent !== content) {
								lastContent = content;
								updateCodeEditor();
							}
						}
					}, 50);

					toWysiwyg(content);
					updateCodeEditor();
					setTimeout(() => {
						toWysiwyg(codeEditor.getValue());
					}, 100);
					resolve({codeEditor, editor, ctrl});
				},
			});
		}

		tinymce
			.init(tinymceSettings)
			.then(([editor]) => {
				editor.theme.panel.find(".sidebar-toolbar button")[0].$el.trigger("click");
			});
	});
}
