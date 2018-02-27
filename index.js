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

let inititalized = false;
const params = window.location.search.substring(1).split("&").reduce((res, i) => {
	if (i.split("=")[0]) {
		let val = i.split("=")[1];
		val = val == null ? true : val;
		res[i.split("=")[0]] = val;
	}
	return res;
}, {});

console.log("params", params);

if (params.init && window.opener) {
	window.addEventListener("message", event => {
		console.log("message", event);
		if (event.data) {
			const data = JSON.parse(event.data);
			if (data.id === params.init) {
				if (data.type === "init" && !inititalized) {
					init(data.data);
				}
			}
		}
	});

	window.opener.postMessage(JSON.stringify({type: `init`, id: params.init}), "*");
}
else {
	const topbar = document.querySelector(".editor-wrapper-menu");
	topbar.parentElement.removeChild(topbar);
	init();
}

function init ({color = "#275fa6", content = "", callbackId} = {}) {
	const colorPrimary = color;
	inititalized = true;

	document.documentElement.style.setProperty("--color--primary", colorPrimary);

	// Initialize the app
	const defaultToolbar = `undo redo | styleselect | bold italic | alignleft
	                   aligncenter alignright alignjustify |
	                   bullist numlist outdent indent | link image`;

	const waitForInit = tinymce.init({
		// skin: false,

		content_style: `:root{--color--primary: ${colorPrimary};}`,
		content_css: ["./css/frame.css", "./css/scrollbar.css"],
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


					if (window.opener && params.init) {
						document.querySelector(".button-ok").addEventListener("click", () => {
							window.opener.postMessage(JSON.stringify({
								type: "save",
								id: callbackId,
								content: codeEditor.getValue(),
							}), "*");
						});
						document.querySelector(".button-cancel").addEventListener("click", () => {
							window.close();
						});
						window.addEventListener("beforeunload", event => {
							window.opener.postMessage(JSON.stringify({
								type: "cancel",
								id: callbackId,
							}), "*");
						});
					}


					iframe.contentWindow.document.documentElement.style.setProperty("--color--primary", colorPrimary);
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
						codeEditor.session.selection.fromJSON(pos);
						ignoreInputTimeout = setTimeout(() => {
							ignoreInput = false;
						}, 50);
					}

					codeEditor.on("input", () => {
						if (ignoreInput) {
							return;
						}
						editor.setContent(codeEditor.getValue());
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

					editor.setContent(content);
					updateCodeEditor();
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
}
