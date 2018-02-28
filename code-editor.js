import ace from "brace";
import "brace/mode/html";
import "brace/mode/handlebars";
import "brace/mode/markdown";
import "brace/mode/ftl";
import "brace/theme/chrome";

const editor = ace.edit("ace-editor");
editor.setTheme("ace/theme/chrome");
// editor.session.setMode("ace/mode/html");
// editor.session.setMode("ace/mode/handlebars");
// editor.session.setMode("ace/mode/markdown");
// editor.session.setMode("ace/mode/ftl");
editor.setOptions({
	// fontFamily: "tahoma",
	displayIndentGuides: true,
	fontSize: "16px",
	wrap: true,
});
window.editorModes = {
	"html": "ace/mode/html",
	"handlebars": "ace/mode/handlebars",
	"markdown": "ace/mode/markdown",
	"freemarker": "ace/mode/ftl",
};
window.setMode = (mode) => {
	editor.session.setMode(window.editorModes[mode] || "html");
};
window.editor = editor;
