/* global __dirname */
const path = require("path");
const merge = require("webpack-merge");
const baseConfig = require("./base.config.js");
const webpack = require("webpack");
const isWSL = require("is-wsl");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = (env = {}) => {
	const result = merge(baseConfig(env), {
		mode: "production",
		optimization: {
			minimizer: [new UglifyJsPlugin({
				// minimize: true,
				// compress: false,
				include: /\.min\.js$/,
				parallel: isWSL ? false : true,
			})]
		},
	});
	result.plugins = result.plugins.slice();
	// result.plugins.push(new webpack.optimize.MinChunkSizePlugin({minChunkSize: 100000}));

	return result;
};
