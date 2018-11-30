#!/usr/bin/env node

import shell from "shelljs";
import yargs from "yargs";


const argv = yargs
	.alias("message", "m")
	.describe("message", "commit message")
	.help("help")
	.argv;


console.log(argv.message);
if (argv.message && typeof argv.message === "string") {
	shell.exec(`git add --all && git commit -m "${argv.message}" && git push`);
}
else {
	shell.exec(`git add --all && git commit && git push`);
}
