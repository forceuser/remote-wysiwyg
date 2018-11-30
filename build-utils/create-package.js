#!/usr/bin/env node
/* global process */
import fs from "fs-extra";
import zip from "bestzip";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
try {
	fs.removeSync("./release/");
	fs.ensureDirSync("./release/");
}
catch (error) {
	//
}

zip({
	cwd: "./dist",
	source: "./*",
	destination: `../release/dist-${pkg.version}.zip`,
})
	.then(() => {
		// fs.copySync("./releases/dist.zip", `./releases/koto-${pkg.version}.zip`);
		console.log("all done!");
	})
	.catch((err) => {
		console.error(err.stack);
		process.exit(1);
	});
