import Markdown from "markdown-it";
import Turndown from "turndown";
// import {gfm} from "turndown-plugin-gfm";
import tinymce from "tinymce/tinymce";
import "tinymce/themes/modern/theme";
// import "tinymce/plugins/contextmenu";
// import "tinymce/plugins/paste";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/table";
// import "tinymce/plugins/code";
import "tinymce/plugins/colorpicker";
import "tinymce/plugins/textcolor";
import "tinymce/plugins/hr";
import "tinymce/plugins/image";
import "tinymce-i18n/langs/ru";
import sanitize from "sanitize-html";
import "./fullpage";

import pretty from "pretty";
import selectionMan from "./selection-man";

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
						"link", "lists", "hr", "image",
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
						"fullpage",
						"link", "lists", "table",
						"colorpicker", "textcolor", "hr", "image",
					],
					toolbar: `${defaultToolbar} | forecolor backcolor`,
					table_toolbar: false,
					valid_elements: "+*[*]",
					valid_children: "+body[style]",
					object_resizing: false,
				},
			{
				skin_url: "./css/tinymce/lightgray",
				content_style: `:root{--color--primary: ${colorPrimary};}`,
				content_css: ["./css/wisywig-content.css"],
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
				onshow () {
					const sidebar = document.body.querySelector(".mce-tinymce .mce-sidebar");
					sidebar.classList.add("sidebar-visible");
					sidebar.classList.remove("sidebar-hidden");
				},
				onhide () {
					const sidebar = document.body.querySelector(".mce-tinymce .mce-sidebar");
					sidebar.classList.add("sidebar-hidden");
					sidebar.classList.remove("sidebar-visible");
				},
				async onrender (api) {
					const panel = api.element();
					panel.classList.add("code-editor-panel");
					panel.innerHTML = `<div class="divider-splitter"></div><iframe id="code-editor" src="./code-editor.html"></iframe>`;
					const divider = panel.children[0];
					const iframe = panel.children[1];
					const sidebar = document.body.querySelector(".mce-tinymce .mce-sidebar");
					const sidebarContainer = sidebar.offsetParent;
					handleDrag(divider, {
						start: (startPoint, type, pressure) => {
							console.log("start", startPoint);
							document.body.classList.add("dragging");
						},
						move: (point, delta, type, pressure) => {
							console.log("move", delta);
							const crect = sidebarContainer.getBoundingClientRect();
							sidebar.style.setProperty("width", `${(1 - (point.x - crect.left) / crect.width) * 100}%`);
						},
						end: () => {
							console.log("end");
							document.body.classList.remove("dragging");
						},
					});

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
					const sl = selectionMan(wysiwyg_ifr.contentWindow);


					const ce = wysiwyg_ifr.contentWindow.document.body;
					let lastSelection;
					let lastAbsSelection;
					wysiwyg_ifr.contentWindow.document.addEventListener("selectionchange", event => {
						lastAbsSelection = sl.saveAbsSelection(ce);
						lastSelection = sl.saveSelection();
					});

					ce.addEventListener("paste", event => {
						event.preventDefault();
						event.stopPropagation();
						if (lastSelection &&
							lastSelection.startContainer && lastSelection.startContainer.parentNode &&
							lastSelection.endContainer && lastSelection.endContainer.parentNode) {
							sl.restoreSelection(lastSelection);
						}
						else {
							sl.restoreAbsSelection(ce, lastAbsSelection);
						}

						const window = wysiwyg_ifr.contentWindow;
						const document = window.document;
						const text = event.clipboardData.getData("text/plain");
						let html = event.clipboardData.getData("text/html") || text;
						console.log("PASTE", text, html);

						let sel;
						let range;
						if (window.getSelection) {
							sel = window.getSelection();
							if (sel.getRangeAt && sel.rangeCount) {
								range = sel.getRangeAt(0);
								range.deleteContents();
								const tmp = document.createElement("div");
								tmp.innerHTML = html;
								const root = tmp.querySelector(`:scope > b[id^="docs-internal-guid"]`) || tmp;
								[...root.querySelectorAll("*")].forEach(node => {
									const italic = node.style.fontStyle === "italic";
									const bold = node.style.fontWeight === "bold" || node.style.fontWeight > 400;
									if (italic && bold) {
										const b = document.createElement("b");
										const i = document.createElement("i");
										i.appendChild(b);
										[...node.childNodes].forEach(n => b.appendChild(n));
										node.parentNode.replaceChild(i, node);
									}
									else if (italic) {
										const i = document.createElement("i");
										[...node.childNodes].forEach(n => i.appendChild(n));
										node.parentNode.replaceChild(i, node);
									}
									else if (bold) {
										const b = document.createElement("b");
										[...node.childNodes].forEach(n => b.appendChild(n));
										node.parentNode.replaceChild(b, node);
									}
								});
								html = root.innerHTML;
								html = html.replace(/&nbsp;/ig, " ");


								const sanitized = sanitize(html, {
									allowedTags: [
										"h1", "h2", "h3", "h4", "h5",
										"ul", "ol", "li", "b", "i", "p", "strong",
										"hr", "br", "img", "a",
										"table", "thead", "caption", "tbody", "tr", "th", "td",
									],
									allowedAttributes: {
										a: ["href", "target"],
										img: ["src", "width", "height"],
									},
								});
								console.log("sanitized", sanitized);
								tmp.innerHTML = sanitized;
								[...tmp.childNodes].forEach((node, idx, arr) => {
									range.insertNode(node);
									range.selectNode(node);
									range.collapse(false);
								});

								sel.removeAllRanges();
								sel.addRange(range);
							}
						}
						else if (document.selection && document.selection.createRange) {
							document.selection.createRange().text = text;
						}
						return false;
					}, true);

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
								addCssToDocument(wysiwyg_ifr.contentWindow.document, data.contentCss);
							}
							if (data.editorCss) {
								addCssToDocument(document, data.editorCss);
							}
							if (data.codeEditorCss) {
								addCssToDocument(iframe.contentWindow.document, data.codeEditorCss);
							}
							if (data.contentStyle) {
								addStyleToDocument(wysiwyg_ifr.contentWindow.document, data.contentStyle);
							}
							if (data.editorStyle) {
								addStyleToDocument(document, data.editorStyle);
							}
							if (data.codeEditorStyle) {
								addStyleToDocument(iframe.contentWindow.document, data.codeEditorStyle);
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

function handleDrag (el, {start, move, end}) {
	let last;
	let point;
	let pointerId;
	const onstart = event => {
		if (pointerId) {
			return;
		}
		if (![1, 2].includes(event.button)) {
			pointerId = event.pointerId;
			event.stopPropagation();
			event.preventDefault();
			event.stopImmediatePropagation();
			last = {x: event.pageX, y: event.pageY};
			const rect = el.getBoundingClientRect();
			point = {x: event.pageX - rect.x, y: event.pageY - rect.y};
			if (start && start(point, event.pointerType, event.pressure) !== false) {
				document.addEventListener("pointermove", onmove, {passive: false});
				document.addEventListener("pointerup", onend, {passive: false});
			}
		}
	};
	const onmove = event => {
		if (event.pointerId === pointerId) {
			event.stopPropagation();
			event.preventDefault();
			event.stopImmediatePropagation();
			if (move) {
				const point = {x: event.pageX, y: event.pageY};
				const delta = {x: point.x - last.x, y: point.y - last.y};
				last = point;
				move(point, delta, event.pointerType, event.pressure);
			}
		}
	};
	const onend = event => {
		if (event.pointerId === pointerId) {
			pointerId = null;
			document.removeEventListener("pointermove", onmove, {passive: false});
			document.removeEventListener("pointerup", onend, {passive: false});
			end && end();
		}
	};

	el.addEventListener("pointerdown", onstart, {passive: false});
	return function unbind () {
		el.removeEventListener("pointerdown", onstart, {passive: false});
		document.removeEventListener("pointermove", onmove, {passive: false});
		document.removeEventListener("pointerup", onend, {passive: false});
	};
}
