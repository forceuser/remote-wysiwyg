#!/usr/bin/env node
import browserSync from "browser-sync";
import path from "path";
import fp from "find-free-port";
import fs from "fs-extra";
import os from "os";
import url from "url";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackHotMiddleware from "webpack-hot-middleware";
import webpack from "webpack";
import webpackConfigRaw from "../webpack/development.config";
import {URL} from "universal-url";
import open from "open";
import merge from "deepmerge";
import yargs from "yargs";

const argv = yargs
	.alias("port", "p")
	.describe("port", "port to start dev server")
	.env("DEV_ENV")
	.option("env", {alias: "env"})
	.help("help")
	.argv;

function getJSON (uri) {
	try {
		return JSON.parse(fs.readFileSync(path.resolve(__dirname, uri), "utf8"));
	}
	catch (error) {
		return {};
	}
}

function get (src, path) {
	const p = path.replace(/["']/g, "").replace(/\[/g, ".").replace(/\]/g, "").split(".");
	let c = src;
	if (p[0]) {
		for (let i = 0; i < p.length; i++) {
			if (i === p.length - 1) {
				return c[p[i]];
			}
			c = c[p[i]];
			if (c == null || typeof c !== "object") {
				return undefined;
			}
		}
	}
	return c;
}

function tpl (tpl, params) {
	tpl = tpl.replace(/\$\{(.*?)\}/igm, (all, param) => {
		const p = get(params, param);
		return p == null ? `[${param}]` : p;
	});
	return tpl;
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const devSettingsDefault = {host: "0.0.0.0"};
const pkg = getJSON("../package.json");
let devSettings = merge(merge(devSettingsDefault, pkg.devSettings || {}), getJSON("../devserver.json"));

if (argv.env) {
	argv.env.split(",").forEach(env => {
		if (devSettings.env && devSettings.env[env]) {
			devSettings = merge(devSettings, devSettings.env[env]);
		}
	});
}

const ifc = os.networkInterfaces();

async function runOnPort (port) {
	const webpackConfig = typeof webpackConfigRaw === "function" ? webpackConfigRaw() : webpackConfigRaw;
	const webpackCompiler = webpack(webpackConfig);
	const bs = browserSync.create();
	const webpackMiddlewares = [
		webpackDevMiddleware(webpackCompiler, {
			publicPath: webpackConfig.output.publicPath,
			stats: "errors-only",
		}),
		webpackHotMiddleware(webpackCompiler, {
			path: "/__webpack_hmr",
			reload: true,
		}),
	];

	const middleware = [
		...webpackMiddlewares,
	];

	bs.init({
		open: false,
		notify: false,
		// online: false,
		// localOnly: true,
		// host: devSettings.host,
		port,
		files: ["dist/**/*"],
		// watchEvents: ["change", "add", "unlink"],
		reloadDebounce: 300,
		ghostMode: {
			clicks: false,
			forms: false,
			scroll: false,
		},
		watchOptions: {
			awaitWriteFinish: true,
		},
		server: {
			baseDir: path.resolve(__dirname, "../dist/"),
			middleware,
		},
	});

	setTimeout(() => {
		console.log("212");
		Object.keys(ifc).forEach(i => {
			(ifc[i] || []).forEach(x => {
				if (x.family === "IPv4") {
					console.log(`listening at http://${x.address}:${port}`);
				}
			});
		});

		if (devSettings.open) {
			console.log("opening", tpl(devSettings.open, devSettings));
			open(tpl(devSettings.open, devSettings));
		}
	}, 2000);
}
if (argv.port || devSettings.port) {
	runOnPort(argv.port || devSettings.port);
}
else {
	console.log("FP");
	fp(8080).then(async ([port]) => {
		runOnPort(port);
	})
		.catch(error => {
			console.log("ERROR", error);
		});
}
