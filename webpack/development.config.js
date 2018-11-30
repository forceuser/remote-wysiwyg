/* global __dirname process */
const path = require("path");
const merge = require("webpack-merge");
const baseConfig = require("./base.config.js");
const webpack = require("webpack");

module.exports = (env = {}) => {
	let result = merge(baseConfig(env), {
		mode: "development",
		devServer: {},
	});
	result.entry.index = ["webpack-hot-middleware/client?reload=true", ...result.entry.index];
	result.plugins = result.plugins.slice();
	result.plugins.push(new webpack.HotModuleReplacementPlugin());
	return result;
}
