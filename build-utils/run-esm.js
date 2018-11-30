#!/usr/bin/env node
/* global process */
process.env.BABEL_ENV = "node";
const path = require("path");
require("module-alias/register");
// eslint-disable-next-line no-global-assign
require = require("esm")(module, {cjs: true});
require("@babel/register");
require("@babel/polyfill");

function getArg (args) {
	const idx = process.argv.findIndex(i => [].concat(args).some(v => v === i));
	if (idx >= 0) {
		return process.argv[idx + 1];
	}
}

module.exports = require(path.resolve(process.cwd(), getArg(["-s", "--script"])));
