import {defineConfig} from "vite";
import {resolve} from "path";
import {viteStaticCopy} from "vite-plugin-static-copy";
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync(resolve(__dirname, "package.json"), "utf8"));

export default defineConfig({
	build: {
		emptyOutDir: true,
		sourcemap: true,
		minify: false,
		outDir: "dist",
		rollupOptions: {
			input: {
				wysiwyg: resolve(__dirname, "src/less/wysiwyg.less"),
				"code-editor": resolve(__dirname, "src/less/code-editor.less"),
				"wisywig-content": resolve(__dirname, "src/less/wisywig-content.less"),
			},
			output: {
				entryFileNames: "css/[name].js",
				assetFileNames: "css/[name][extname]",
			},
		},
	},

	css: {
		preprocessorOptions: {
			less: {
				javascriptEnabled: true,
			},
		},
	},

	plugins: [
		viteStaticCopy({
			targets: [
				{
					src: "src/templates/*.html",
					dest: ".",
					transform: (content) => {
						return content
							.replace(/\$\{version\}/g, pkg.version)
							.replace(/\$\{timestamp\}/g, new Date().toISOString());
					},
				},
				{
					src: "node_modules/tinymce/skins/lightgray",
					dest: "css/tinymce",
					rename: "lightgray",
				},
			],
		}),
	],
});
