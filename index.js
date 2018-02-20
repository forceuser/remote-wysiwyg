import tinymce from "tinymce/tinymce";
// theme
import "tinymce/themes/modern/theme";
// plugins
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

// Initialize the app
tinymce.init({
	// skin: false,
	content_style: `html, body {min-height: 100vh;} html { overflow: auto;} body { overflow: hidden; margin: 0; padding: 1em; box-sizing: border-box;}`,
	selector: "#mytextarea",
	plugins: [
		"paste", "link", "lists", "table",
		"code", "codesample", "colorpicker", "textcolor", "hr", "image", "imagetools",
	],
	toolbar: "forecolor backcolor",
	language: "ru",
});

console.log("12312213");
