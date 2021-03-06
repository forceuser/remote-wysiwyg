import ace from "brace";
import "brace/mode/html";
import "brace/mode/handlebars";
import "brace/mode/markdown";
import "brace/mode/ftl";
import "brace/theme/chrome";
import "brace/theme/idle_fingers";

const editor = ace.edit("ace-editor");
editor.setTheme("ace/theme/chrome");
editor.setOptions({
	// fontFamily: "tahoma",
	displayIndentGuides: true,
	fontSize: "16px",
	scrollPastEnd: 0.5,
	// wrap: true,
});
window.editorModes = {
	"html": "ace/mode/html",
	"handlebars": "ace/mode/handlebars",
	"markdown": "ace/mode/markdown",
	"freemarker": "ace/mode/ftl",
};
window.setMode = (mode) => {
	editor.session.setMode(window.editorModes[mode] || "html");
	if (mode === "markdown") {
		editor.setOptions({wrap: true});
	}
};
window.setTheme = (theme) => {
	editor.setTheme(theme === "dark" ? "ace/theme/idle_fingers" : "ace/theme/chrome");
};
window.editor = editor;
