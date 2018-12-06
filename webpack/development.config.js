/* global __dirname process */
const path = require("path");
const merge = require("webpack-merge");
const baseConfig = require("./base.config.js");
const webpack = require("webpack");

module.exports = (env = {}) => {
	const base = baseConfig(env);
	let result = merge(base, {
		mode: "development",
		devServer: {},
	});

	Object.keys(result.entry).forEach(key => {
		result.entry[key] = ["webpack-hot-middleware/client?reload=true"].concat(result.entry[key]);
	});
	result.plugins.push(new webpack.HotModuleReplacementPlugin());
	return result;
}
