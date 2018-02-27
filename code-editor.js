import ace from "brace";
import "brace/mode/html";
import "brace/theme/chrome";

const editor = ace.edit("ace-editor");
editor.setTheme("ace/theme/chrome");
editor.session.setMode("ace/mode/html");
editor.setOptions({
	// fontFamily: "tahoma",
	fontSize: "16px",
	wrap: true,
});
window.editor = editor;
