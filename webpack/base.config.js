/* global __dirname */
const webpack = require("webpack");
const path = require("path");
const pkg = require("../package.json");
const ma = pkg._moduleAliases || {};
const alias = Object.keys(ma).reduce((acc, key) => (acc[key] = path.resolve(__dirname, "../", ma[key])  , acc), {});



module.exports = (env = {}) => {
	function entry (name) {
		return [
			"./polyfill/all.js",
			"./polyfill/custom-elements.min.js",
			"regenerator-runtime/runtime",
			`./src/js/${name}.js`,
		];
	}

	return ({
		entry: ["wysiwyg", "code-editor"].reduce((acc, name) => (acc[name] = entry(name), acc), {}),
		output: {
			path: path.resolve(__dirname, "../dist/js"),
			filename: "[name].js",
			library: "[name]",
			libraryTarget: "umd",
			publicPath: `/resources/${pkg.version}/js/`,
		},
		resolve: {
			alias: alias,
		},
		devtool: "source-map",
		module: {
			rules: [
				{
					test: /\.(js|mjs)$/,
					exclude: /(node_modules)/,
					use: [{
						loader: "babel-loader",
						options: {
							babelrc: true,
							// envName: "browser",
						},
					}],
				},
				{
					test: /(\.html|\.txt)$/,
					use: [
						{
							loader: "raw-loader"
						}
					]
				},
			],
		},
		plugins: [
			// new webpack.ProvidePlugin({
			// 	$: "jquery",
			// 	jQuery: "jquery",
			// 	"window.jQuery": "jquery"
			// }),
		],
	});
}
