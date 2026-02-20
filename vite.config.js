import {defineConfig} from "vite";
import {resolve} from "path";
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync(resolve(__dirname, "package.json"), "utf8"));

export default defineConfig(({mode}) => {
	const entry = mode === "wysiwyg"
		? {wysiwyg: resolve(__dirname, "src/js/wysiwyg.js")}
		: mode === "code-editor"
			? {"code-editor": resolve(__dirname, "src/js/code-editor.js")}
			: {
				wysiwyg: resolve(__dirname, "src/js/wysiwyg.js"),
				"code-editor": resolve(__dirname, "src/js/code-editor.js"),
			};

	return {
		build: {
			lib: {
				entry,
				formats: ["es"],
				name: "remoteWysiwyg",
				fileName: (format, name) => `${name}${format === "iife" ? "" : ".esm"}.js`,
			},
			outDir: "dist/js",
			sourcemap: true,
			minify: "terser",// mode === "code-editor" ? false : "terser",
			// terserOptions: {
			// 	// ecma: 2015,

			// 	compress: {
			// 		keep_fnames: true,
			// 	},
			// 	format: {
			// 		comments: false,
			// 		ascii_only: false,
			// 	},
			// },
			rollupOptions: {
				output: {
					assetFileNames: "../css/[name][extname]",
				},
			},
			emptyOutDir: mode !== "wysiwyg" && mode !== "code-editor",
		},

		resolve: {
			alias: {
				root: resolve(__dirname, "src/js"),
			},
		},

		css: {
			preprocessorOptions: {
				less: {
					javascriptEnabled: true,
				},
			},
		},

		define: {
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
		},

		plugins: [
			// fixIifeRegexPlugin()


		],
	};
});
