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

import {html as beautify} from "js-beautify";

// Initialize the app
const defaultToolbar = `undo redo | styleselect | bold italic | alignleft
                   aligncenter alignright alignjustify |
                   bullist numlist outdent indent | link image`;

const waitForInit = tinymce.init({
	// skin: false,
	// content_style: `html, body {min-height: 100vh;} html { overflow: auto;} body { overflow: hidden; margin: 0; padding: 1em; box-sizing: border-box;}`,
	content_css: "./frame.css",
	selector: "#mytextarea",
	plugins: [
		"contextmenu", "fullpage",
		"paste", "link", "lists", "table",
		"code", "codesample", "colorpicker", "textcolor", "hr", "image", "imagetools",
	],
	table_toolbar: false,
	toolbar: `${defaultToolbar} | forecolor backcolor | fullpage`,
	language: "ru",
	force_p_newlines: true,
	force_br_newlines: true,
	remove_linebreaks: false,
	forced_root_block: false,
	valid_elements: "+*[*]",
	valid_children: "+body[style]",
	branding: false,
	setup (editor) {
		editor.settings.fullpage_enabled = false;
		editor.addSidebar("codebar", {
			tooltip: "Code sidebar",
			icon: "code",
			classes: "code-btn",
			async onrender (api) {
				console.log("Render panel", api.element());
				const panel = api.element();
				panel.classList.add("code-editor-panel");
				panel.innerHTML = `<iframe id="code-editor" src="./code-editor.html"></iframe>`;
				const iframe = panel.children[0];
				const codeEditor = await (new Promise(resolve => {
					const inerv = setInterval(() => {
						if (iframe.contentWindow && iframe.contentWindow.editor) {
							clearInterval(inerv);
							resolve(iframe.contentWindow.editor);
						}
					}, 100);
				}));
				codeEditor.$blockScrolling = Infinity;
				let ignoreInput = false;
				let ignoreInputTimeout;
				function updateCodeEditor () {
					clearTimeout(ignoreInputTimeout);
					ignoreInput = true;
					const pos = codeEditor.session.selection.toJSON();
					codeEditor.session.setValue(beautify(editor.getContent(), {
						"preserve-newlines": false,
						"indent-with-tabs": true,
						"indent-inner-html": true,
						"max-preserve-newlines": 1,
					}));
					codeEditor.beautify();
					codeEditor.session.selection.fromJSON(pos);
					ignoreInputTimeout = setTimeout(() => {
						ignoreInput = false;
					}, 50);
				}
				updateCodeEditor();
				codeEditor.on("input", () => {
					if (ignoreInput) {
						return;
					}
					editor.setContent(codeEditor.getValue());
				});
				let lastContent = "";
				setInterval(() => {
					console.log("iframe active", document.activeElement === iframe);
					if (document.activeElement !== iframe) {
						const content = editor.getContent();
						if (lastContent !== content) {
							lastContent = content;
							updateCodeEditor();
						}
					}
				}, 50);
				console.log("editor", codeEditor);

				// editor.on("Change", () => {
				// 	updateCodeEditor();
				// });
				// editor.on("Dirty", () => {
				// 	updateCodeEditor();
				// });
				// editor.on("input", () => {
				// 	updateCodeEditor();
				// });
				// editor.on("Undo", () => {
				// 	updateCodeEditor();
				// });
				// editor.on("Redo", () => {
				// 	updateCodeEditor();
				// });
				// editor.on("Paste", () => {
				// 	updateCodeEditor();
				// });
			},
			onshow (api) {
			},
			onhide (api) {
			},
		});

	},
});

waitForInit.then(([editor]) => {
	editor.theme.panel.find(".sidebar-toolbar button")[0].$el.trigger("click");
});
