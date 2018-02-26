/* global __dirname */
const path = require("path");

module.exports = {
	entry: {
		"code-editor": ["./polyfill/polyfill.js", "regenerator-runtime/runtime", path.resolve(__dirname, "./code-editor.js")],
	},
	output: {
		path: path.resolve(__dirname, "./dist"),
		filename: "[name].js",
		library: "codeEditor",
		libraryTarget: "umd",
	},
	devtool: "source-map",
	module: {
		rules: [{
			test: /\.js$/,
			exclude: /(node_modules)/,
			use: [{
				loader: "babel-loader",
				options: {
					presets: ["env"],
					plugins: ["transform-async-to-generator"],
				},
			}],
		}],
		// loaders: [
		// 	{
		// 		test: require.resolve("tinymce/tinymce"),
		// 		loaders: ["imports?this=>window", "exports?window.tinymce"],
		// 	},
		// 	{
		// 		test: /tinymce\/(themes|plugins)\//,
		// 		loaders: ["imports?this=>window"],
		// 	},
		// ],
	},
	plugins: [
	],
};
