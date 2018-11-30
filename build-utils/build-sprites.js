#!/usr/bin/env node

import path from "path";
import globby from "globby";
import fs from "fs-extra";
import shell from "shelljs";
import et from "elementtree";
import {URL} from "universal-url";
import process from "process";

const XML = et.XML;
const element = et.Element;
function markParent (el) {
	(el._children || []).forEach(child => {
		child._parent = el;
		markParent(child);
	});
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const categories = {};
globby.sync(["../dist/icons/sprites/*.svg"], {cwd: __dirname}).forEach(fn => {
	fs.unlink(path.resolve(__dirname, fn));
});

globby.sync(["../../templates/svg/*.svg"], {cwd: __dirname}).forEach(fn => {
	fs.unlink(path.resolve(__dirname, fn));
});

let idLast = 0;

globby.sync(["../src/sprites/**/*.svg"], {cwd: __dirname}).forEach(fn => {
	const category = fn
		.replace(/^\.\.\//, "")
		.replace(/^\.\//, "")
		.split("/")
		.slice(-2)[0];
	const id = category + "_" + path.basename(fn, ".svg");
	categories[category] = categories[category] || [];
	const file = fs.readFileSync(path.resolve(__dirname, fn), "utf8");
	let content = file;

	const etree = et.parse(content);
	etree._root.constructor.prototype.insert = function (index, element) {
		this._children.splice(index, 0, element);
	};
	// console.log(JSON.stringify(etree._root));
	const svg = etree._root;
	let symbol = svg.find("symbol");
	if (!symbol || svg._children.length > 1) {
		symbol = element("symbol");
		symbol._children = svg._children;
		symbol.attrib = svg.attrib;
	}
	etree._root = symbol;
	symbol.set("id", id);
	if (!symbol.get("preserveAspectRatio")) {
	  symbol.set("preserveAspectRatio", "xMidYMid slice");
	}
	let width = symbol.get("width");
	let height = symbol.get("height");
	let viewBox = symbol.get("viewBox");
	delete symbol.attrib.height;
	delete symbol.attrib.width;

	if (!viewBox && (width || height)) {
		width = width || height;
		height = height || width;
		viewBox = `0 0 ${width} ${height}`;
		symbol.set("viewBox", viewBox);
	}
	markParent(etree._root);

	(etree._root.findall(".//*[@id='Grid']") || []).forEach(el => {
		el._parent.remove(el);
	});
	(etree._root.findall(".//*[@style='display:none;']") || []).forEach(el => {
		el._parent.remove(el);
	});

	content = etree.write({"xml_declaration": false});

	content.replace(/ id=['"](.*?)['"]/igm, (all, p1) => {
		idLast++;
		if (p1 !== id) {
			content = content.replace(new RegExp(`id="${p1}"`, "igm"), `id="ugid${idLast}"`);
			content = content.replace(new RegExp(`#${p1}\\b`, "igm"), `${"${basePath}${pagePathAndQuery}"}#ugid${idLast}`);
		}
		return "";
	});

	categories[category].push({symbol: content, id, viewBox});
});

const svgStart = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
const svgEnd = `</svg>`;
let allSvg = "";
Object.keys(categories).forEach((category) => {
	let content = `${svgStart}\n`;
	categories[category].forEach(icon => {
		content += `${icon.symbol}\n`;
	});
	content += svgEnd;
	console.log("icon category", category);
	try {
		const etree = et.parse(content);
		etree._root.constructor.prototype.insert = function (index, element) {
  			this._children.splice(index, 0, element);
		};

		// const symbols = etree._root.findall("symbol");
		// (symbols || []).forEach(symbol => {
		//
		// });

		markParent(etree._root);

		const tags = ["linearGradient", "radialGradient", "mask", "clipPath", "filter"];
		let nodes = [];
		tags.forEach(tag => nodes = nodes.concat(etree.findall(`.//${tag}`)));
		if (nodes.length) {
			const defs = element("defs");
			etree._root.insert(0, defs);
			nodes.forEach(el => {
				el._parent.remove(el);
				defs.insert(0, el);
			});
		}
		content = etree.write({"xml_declaration": false});
	}
	catch (error) {
		console.log("error", error);
	}

	allSvg += content.replace(/(<symbol[^>]*?id=")([^"]*?)/igm, `$1${category}__$2`);
	fs.writeFile(path.resolve(__dirname, `../dist/icons/sprites/${category}.svg`), content, "utf8");
	fs.writeFile(path.resolve(__dirname, `../../templates/svg/${category}.svg`), content, "utf8");
});
allSvg = allSvg.replace(/<!--.*?-->/igm, "").replace(/<\?.*?>/igm, "");



const iconsHTML = `
	<html>
		<head>
			<title>material svg icons</title>
			<style>
				html, body {
					font-family: Arial;
				}
				*, *:after, *:before {
				    box-sizing: border-box;
				    background: none;
				    color: inherit;
				    font: inherit;
				    padding: 0;
				    margin: 0;
				    outline: none;
				    border: none;
				    box-shadow: none;
				    vertical-align: top;
				    min-height: 0;
				    min-width: 0;
				}
				.svg-icon {
					fill: currentColor;
					width: 1em;
					height: 1em;
				}
				.icon-list {
					display: flex;
					flex-wrap: wrap;
				}
				.icon-list .item {
					padding: 10px;
					margin: 2px;
					background: #f4f4f4;
					transition: all 0.3s ease;
					cursor: pointer;
					width: 130px;
					min-height: 130px;
				    display: flex;
				    flex-direction: column;
				    align-items: center;
				    justify-content: center;
				}
				.icon-list .item .caption {
					font-size: 11px;
					margin-top: 6px;
					margin-bottom: 4px;
					text-align: center;
				}
				.item-icon-container {
					flex: 1;
					font-size: 2.5em;
					display: flex;
					justify-content: center;
					align-items: center;
				}

				.icon-list .item:hover {
					background: #86d3ff;
				}
				body {
					padding-left: 20px;
					padding-right: 20px;
					padding-bottom: 5em;
					line-height: 1.44;
				}
				body .content {
					max-width: 1024px;
					margin: auto;
				}
				h2 {
					font-size: 3em;
					margin: 1em 0px;
				}
				h3 {
					font-size: 1.2em;
					margin: 1em 0px;
					margin-top: 0px;
				}
				.floating-index {
					position: fixed;
					top: 20px;
					right: 50px;
					width: 300px;
					max-height: 700px;
					overflow-y: auto;
					padding: 20px;
    				background: #eee;
				}
				.floating-index ul {
					list-style: none;
				}

				.floating-index ul li {
					padding-left: 10px;
				}
				.floating-index a, .floating-index a:hover{
					text-decoration: none;
				}
				.floating-index a:hover {
					color: #1690d6;
				}
			</style>
		</head>
		<body>
			<div style="position: absolute; z-index: -1; width: 0; height: 0; overflow: hidden; opacity: 0;">
				${allSvg}
			</div>
			<div class="floating-index">
				<h3>Select category</h3>
				<ul>
				${
	Object.keys(categories).map(category => {
		return `<li><a href="#ctg____${category}">${category}</a></li>`;
	}).join("\n")
}
				</ul>
			</div>
			<script>
				function copy (value) {
					function onCopy (event) {
						event.clipboardData.setData("text/plain", value);
						event.preventDefault();
						document.removeEventListener("copy", onCopy);
					}
					document.addEventListener("copy", onCopy);
					document.execCommand("copy");
				}
			</script>
			<div class="content">
			${
	Object.keys(categories).map(category => {
		return `
						<div>
							<h2 id="ctg____${category}">${category}</h2>
							<div class="icon-list">
							${
	categories[category].map(icon => {
		return `
										<div class="item" onclick="copy('${category}#${icon.id}')">
											<div class="item-icon-container">
												<svg class="svg-icon" viewBox="${icon.viewBox}">
													<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#${category}__${icon.id}"></use>
												</svg>
											</div>
											<div class="caption">
												${icon.id}
											</div>
										</div>
									`;
	}).join("\n")
}
							</div>
						</div>
					`;
	}).join("\n")
}
			</div>
		</body>
	</html>
`;

fs.writeFileSync(path.resolve(__dirname, "../dist/icons/sprites/index.html"), iconsHTML, "utf8");
