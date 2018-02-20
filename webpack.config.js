/* global __dirname */
const path = require("path");

module.exports = {
	entry: {
		"wysiwyg": path.resolve(__dirname, "./index.js"),
	},
	output: {
		path: path.resolve(__dirname, "./dist"),
		filename: "[name].js",
		library: "wysiwyg",
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
					plugins: [],
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
