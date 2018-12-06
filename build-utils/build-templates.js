#!/usr/bin/env node
/* global process */
import path from "path";
import fs from "fs-extra";
import globby from "globby";
import merge from "deepmerge";
import Mustache from "mustache";
import {URL} from "universal-url";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"));

console.log("TEMPL");

async function buildTemplates (params) {
	const paths = await globby("./templates/*", {cwd: path.resolve(__dirname, "../src/")});
	console.log("paths", paths, path.resolve(__dirname, "../src/"));
	paths.forEach(async fp => {
		console.log("BUILD TEMPLATE", fp);
		const distFp = path.basename(fp, path.extname(fp));
		await fs.ensureFile(path.resolve(__dirname, "../dist/", `${distFp}.html`));
		const extraParams = {};

		await fs.writeFile(
			path.resolve(__dirname, "../dist/", `${distFp}.html`),
			Mustache.render(
				fs.readFileSync(path.resolve(__dirname, "../src/", fp), "utf8"),
				merge(params || {}, extraParams)
			)
		);


	});
}


buildTemplates({
	version: pkg.version,
	timestamp: new Date(),
	package: pkg,
});
