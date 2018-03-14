import tinymce from "tinymce/tinymce";

(function () {
	const fullpage = (function () {
		const Cell = function (initial) {
			let value = initial;
			const get = function () {
				return value;
			};
			const set = function (v) {
				value = v;
			};
			const clone = function () {
				return Cell(get());
			};
			return {
				get,
				set,
				clone,
			};
		};

		const PluginManager = tinymce.util.Tools.resolve("tinymce.PluginManager");

		const Tools = tinymce.util.Tools.resolve("tinymce.util.Tools");

		const DomParser = tinymce.util.Tools.resolve("tinymce.html.DomParser");

		const Node = tinymce.util.Tools.resolve("tinymce.html.Node");

		const Serializer = tinymce.util.Tools.resolve("tinymce.html.Serializer");

		const shouldHideInSourceView = function (editor) {
			return editor.getParam("fullpage_hide_in_source_view");
		};
		const getDefaultXmlPi = function (editor) {
			return editor.getParam("fullpage_default_xml_pi");
		};
		const getDefaultEncoding = function (editor) {
			return editor.getParam("fullpage_default_encoding");
		};
		const getDefaultFontFamily = function (editor) {
			return editor.getParam("fullpage_default_font_family");
		};
		const getDefaultFontSize = function (editor) {
			return editor.getParam("fullpage_default_font_size");
		};
		const getDefaultTextColor = function (editor) {
			return editor.getParam("fullpage_default_text_color");
		};
		const getDefaultTitle = function (editor) {
			return editor.getParam("fullpage_default_title");
		};
		const getDefaultDocType = function (editor) {
			return editor.getParam("fullpage_default_doctype", "<!DOCTYPE html>");
		};
		const $_4aeordbdjdud7a9d = {
			shouldHideInSourceView,
			getDefaultXmlPi,
			getDefaultEncoding,
			getDefaultFontFamily,
			getDefaultFontSize,
			getDefaultTextColor,
			getDefaultTitle,
			getDefaultDocType,
		};

		const parseHeader = function (head) {
			return DomParser({
				validate: false,
				root_name: "#document",
			}).parse(head);
		};
		const htmlToData = function (editor, head) {
			const headerFragment = parseHeader(head);
			const data = {pagemode: editor.getParam("fullpage_pagemode", "body")};
			let elm;
			function getAttr (elm, name) {
				const value = elm.attr(name);
				return value || "";
			}
			data.fontface = $_4aeordbdjdud7a9d.getDefaultFontFamily(editor);
			data.fontsize = $_4aeordbdjdud7a9d.getDefaultFontSize(editor);
			elm = headerFragment.getAll("#doctype")[0];
			if (elm) {
				data.pagemode = elm.value.match(/XHTML/ig) ? "xhtml" : "html";
			}
			elm = headerFragment.getAll("title")[0];
			if (elm && elm.firstChild) {
				data.title = elm.firstChild.value;
			}
			Tools.each(headerFragment.getAll("meta"), (meta) => {
				const name = meta.attr("name");
				const httpEquiv = meta.attr("http-equiv");
				let matches;
				if (name) {
					data[name.toLowerCase()] = meta.attr("content");
				}
				else if (httpEquiv === "Content-Type") {
					matches = /charset\s*=\s*(.*)\s*/gi.exec(meta.attr("content"));
					if (matches) {
						data.docencoding = matches[1];
					}
				}
			});
			elm = headerFragment.getAll("html")[0];
			if (elm) {
				data.langcode = getAttr(elm, "lang") || getAttr(elm, "xml:lang");
				data.htmlAttrs = [...elm.attributes].map(({name, value}) => ({name, value}));
			}
			data.stylesheets = [];
			Tools.each(headerFragment.getAll("link"), (link) => {
				if (link.attr("rel") === "stylesheet") {
					data.stylesheets.push(link.attr("href"));
				}
			});
			elm = headerFragment.getAll("body")[0];
			if (elm) {
				data.bodyAttrs = [...elm.attributes].map(({name, value}) => ({name, value}));
			}
			return data;
		};
		const dataToHtml = function (editor, data, head) {
			let headElement;
			let elm;
			let value;
			const dom = editor.dom;
			function setAttr (elm, name, value) {
				elm.attr(name, value ? value : undefined);
			}
			function addHeadNode (node) {
				if (headElement.firstChild) {
					headElement.insert(node, headElement.firstChild);
				}
				else {
					headElement.append(node);
				}
			}
			const headerFragment = parseHeader(head);
			headElement = headerFragment.getAll("head")[0];
			if (!headElement) {
				elm = headerFragment.getAll("html")[0];
				headElement = new Node("head", 1);
				if (elm.firstChild) {
					elm.insert(headElement, elm.firstChild, true);
				}
				else {
					elm.append(headElement);
				}
			}

			elm = headerFragment.getAll("#doctype")[0];
			const pagemode = data.pagemode || editor.getParam("fullpage_pagemode", "body");
			if (pagemode !== "body") {
				if (!elm) {
					elm = new Node("#doctype", 10);
					addHeadNode(elm);
				}
				elm.value = data.pagemode === "html" ? " html" : ` html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"`;
			}
			else {
				data.pagemode = "body";
				if (elm) {
					elm.remove();
				}
			}
			elm = null;
			Tools.each(headerFragment.getAll("meta"), (meta) => {
				if (meta.attr("http-equiv") === "Content-Type") {
					elm = meta;
				}
			});
			if (data.docencoding) {
				if (!elm) {
					elm = new Node("meta", 1);
					elm.attr("http-equiv", "Content-Type");
					elm.shortEnded = true;
					addHeadNode(elm);
				}
				elm.attr("content", "text/html; charset=" + data.docencoding);
			}
			else if (elm) {
				elm.remove();
			}
			elm = headerFragment.getAll("title")[0];
			if (data.title) {
				if (!elm) {
					elm = new Node("title", 1);
					addHeadNode(elm);
				}
				else {
					elm.empty();
				}
				elm.append(new Node("#text", 3)).value = data.title;
			}
			else if (elm) {
				elm.remove();
			}
			Tools.each("keywords,description,author,copyright,robots".split(","), (name) => {
				const nodes = headerFragment.getAll("meta");
				let i;
				let meta;
				const value = data[name];
				for (i = 0; i < nodes.length; i++) {
					meta = nodes[i];
					if (meta.attr("name") === name) {
						if (value) {
							meta.attr("content", value);
						}
						else {
							meta.remove();
						}
						return;
					}
				}
				if (value) {
					elm = new Node("meta", 1);
					elm.attr("name", name);
					elm.attr("content", value);
					elm.shortEnded = true;
					addHeadNode(elm);
				}
			});
			const currentStyleSheetsMap = {};
			Tools.each(headerFragment.getAll("link"), (stylesheet) => {
				if (stylesheet.attr("rel") === "stylesheet") {
					currentStyleSheetsMap[stylesheet.attr("href")] = stylesheet;
				}
			});
			Tools.each(data.stylesheets, (stylesheet) => {
				if (!currentStyleSheetsMap[stylesheet]) {
					elm = new Node("link", 1);
					elm.attr({
						rel: "stylesheet",
						text: "text/css",
						href: stylesheet,
					});
					elm.shortEnded = true;
					addHeadNode(elm);
				}
				delete currentStyleSheetsMap[stylesheet];
			});
			Tools.each(currentStyleSheetsMap, (stylesheet) => {
				stylesheet.remove();
			});
			elm = headerFragment.getAll("body")[0];
			if (elm) {
				// (data.bodyAttrs || []).forEach(({name, value}) => elm.attr(name, value));

				// setAttr(elm, "dir", data.langdir);
				// setAttr(elm, "style", data.style);
				// setAttr(elm, "vlink", data.visited_color);
				// setAttr(elm, "link", data.link_color);
				// setAttr(elm, "alink", data.active_color);
				// dom.setAttribs(editor.getBody(), {
				// 	style: data.style,
				// 	dir: data.dir,
				// 	vLink: data.visited_color,
				// 	link: data.link_color,
				// 	aLink: data.active_color,
				// });
			}
			elm = headerFragment.getAll("html")[0];
			if (elm) {
				if (data.pagemode === "xhtml") {
					elm.attr("lang", null);
					setAttr(elm, "xml:lang", data.langcode);
					setAttr(elm, "xmlns", "http://www.w3.org/1999/xhtml");
				}
				else {
					[...elm.attributes].map(({name}) => name).filter(n => {
						return n.startsWith("xml");
					}).forEach(n => {
						elm.attr(n, null);
					});
					setAttr(elm, "lang", data.langcode);
				}
			}
			if (!headElement.firstChild) {
				headElement.remove();
			}
			const html = Serializer({
				validate: false,
				indent: true,
				apply_source_formatting: true,
				indent_before: "head,html,body,meta,title,script,link,style",
				indent_after: "head,html,body,meta,title,script,link,style",
			}).serialize(headerFragment);
			return html.substring(0, html.indexOf("</body>"));
		};
		const $_58tdt7b9jdud7a94 = {
			parseHeader,
			htmlToData,
			dataToHtml,
		};

		const open = function (editor, headState) {
			const data = $_58tdt7b9jdud7a94.htmlToData(editor, headState.get());

			editor.windowManager.open({
				title: "Document properties",
				data,
				defaults: {
					type: "textbox",
					size: 40,
				},
				body: [
					{
						type: "listbox",
						name: "pagemode",
						label: "Page mode",
						values: [
							{text: "body", value: "body"},
							{text: "xhtml", value: "xhtml"},
							{text: "html", value: "html"},
						],
						value: data.pagemode,
					},
					{
						name: "title",
						label: "Title",
					},
					{
						name: "keywords",
						label: "Keywords",
					},
					{
						name: "description",
						label: "Description",
					},
					{
						name: "robots",
						label: "Robots",
					},
					{
						name: "author",
						label: "Author",
					},
					{
						name: "docencoding",
						label: "Encoding",
					},
				],
				onSubmit (e) {
					editor.settings.fullpage_pagemode = e.data.pagemode;
					editor.settings.fullpage_ignoreswitch = true;
					if (e.data.pagemode !== "body") {
						editor.setContent(editor.getContent());
						const headHtml = $_58tdt7b9jdud7a94.dataToHtml(editor, Tools.extend(data, e.data), headState.get());
						headState.set(headHtml);
					}
					else {
						headState.set("");
						editor.setContent(editor.getContent());
					}
					editor.settings.fullpage_ignoreswitch = false;
				},
			});
		};
		const $_1z4w7sb7jdud7a90 = {open};

		const register = function (editor, headState) {
			editor.addCommand("mceFullPageProperties", () => {
				$_1z4w7sb7jdud7a90.open(editor, headState);
			});
		};
		const $_9bxf9tb6jdud7a8z = {register};

		const protectHtml = function (protect, html) {
			Tools.each(protect, (pattern) => {
				html = html.replace(pattern, (str) => {
					return "<!--mce:protected " + escape(str) + "-->";
				});
			});
			return html;
		};
		const unprotectHtml = function (html) {
			return html.replace(/<!--mce:protected ([\s\S]*?)-->/g, (a, m) => {
				return unescape(m);
			});
		};
		const $_73m398bfjdud7a9l = {
			protectHtml,
			unprotectHtml,
		};

		const each = Tools.each;
		const low = function (s) {
			return s.replace(/<\/?[A-Z]+/g, (a) => {
				return a.toLowerCase();
			});
		};
		const handleSetContent = function (editor, headState, footState, evt) {
			let startPos;
			let endPos;
			let content;
			let styles = "";
			const dom = editor.dom;
			let elm;
			if (evt.selection) {
				return;
			}
			content = $_73m398bfjdud7a9l.protectHtml(editor.settings.protect, evt.content);
			if (evt.format === "raw" && headState.get()) {
				return;
			}
			if (evt.source_view && $_4aeordbdjdud7a9d.shouldHideInSourceView(editor)) {
				return;
			}
			if (content.length === 0 && !evt.source_view) {
				content = Tools.trim(headState.get()) + "\n" + Tools.trim(content) + "\n" + Tools.trim(footState.get());
			}
			content = content.replace(/<(\/?)BODY/gi, "<$1body");
			startPos = content.indexOf("<body");
			if (startPos !== -1) {
				startPos = content.indexOf(">", startPos);
				headState.set(low(content.substring(0, startPos + 1)));
				endPos = content.indexOf("</body", startPos);
				if (endPos === -1) {
					endPos = content.length;
				}
				evt.content = Tools.trim(content.substring(startPos + 1, endPos));
				footState.set(low(content.substring(endPos)));
			}
			else {
				headState.set(getDefaultHeader(editor));
				footState.set("\n</body>\n</html>");
			}
			const headerFragment = $_58tdt7b9jdud7a94.parseHeader(headState.get());
			each(headerFragment.getAll("style"), (node) => {
				if (node.firstChild) {
					styles += node.firstChild.value;
				}
			});

			elm = headerFragment.getAll("html")[0];
			if (elm) {
				const html = editor.getBody().parentNode;
				const htmlAttrs = [...html.attributes].reduce((res, {name}) => {
					res[name] = false;
					return res;
				}, {});
				const attrs = [...elm.attributes].map(({name, value}) => ({name, value}));
				attrs.forEach(({name, value}) => {
					htmlAttrs[name] = true;
					html.setAttribute(name, value);
				});
				Object.keys(htmlAttrs).forEach(key => {
					if (!htmlAttrs[key]) {
						html.removeAttribute(key);
					}
				});
			}

			elm = headerFragment.getAll("body")[0];
			if (elm) {
				const body = editor.getBody();
				const ignoreAttrs = ["id", "class", "data-id", "contenteditable", "spellcheck"];
				const bodyAttrs = [...body.attributes].filter(attr => !ignoreAttrs.includes(attr.name)).reduce((res, {name}) => {
					res[name] = false;
					return res;
				}, {});
				const attrs = [...elm.attributes].filter(attr => !ignoreAttrs.includes(attr.name)).map(({name, value}) => ({name, value}));
				attrs.forEach(({name, value}) => {
					bodyAttrs[name] = true;
					body.setAttribute(name, value);
				});
				Object.keys(bodyAttrs).forEach(key => {
					if (!bodyAttrs[key]) {
						body.removeAttribute(key);
					}
				});

				body.setAttribute("class", "mce-content-body " + (elm.attr("class")));
			}
			dom.remove("fullpage_styles");
			const headElm = editor.getDoc().getElementsByTagName("head")[0];
			if (styles) {
				dom.add(headElm, "style", {id: "fullpage_styles"}, styles);
				elm = dom.get("fullpage_styles");
				if (elm.styleSheet) {
					elm.styleSheet.cssText = styles;
				}
			}
			const currentStyleSheetsMap = {};
			Tools.each(headElm.getElementsByTagName("link"), (stylesheet) => {
				if (stylesheet.rel === "stylesheet" && stylesheet.getAttribute("data-mce-fullpage")) {
					currentStyleSheetsMap[stylesheet.href] = stylesheet;
				}
			});
			Tools.each(headerFragment.getAll("link"), (stylesheet) => {
				const href = stylesheet.attr("href");
				if (!href) {
					return true;
				}
				if (!currentStyleSheetsMap[href] && stylesheet.attr("rel") === "stylesheet") {
					dom.add(headElm, "link", {
						"rel": "stylesheet",
						"text": "text/css",
						href,
						"data-mce-fullpage": "1",
					});
				}
				delete currentStyleSheetsMap[href];
			});
			Tools.each(currentStyleSheetsMap, (stylesheet) => {
				stylesheet.parentNode.removeChild(stylesheet);
			});
		};
		const getDefaultHeader = function (editor) {
			let header = "";
			let value;
			let styles = "";
			if ($_4aeordbdjdud7a9d.getDefaultXmlPi(editor)) {
				const piEncoding = $_4aeordbdjdud7a9d.getDefaultEncoding(editor);
				header += "<?xml version=\"1.0\" encoding=\"" + (piEncoding ? piEncoding : "ISO-8859-1") + "\" ?>\n";
			}
			header += $_4aeordbdjdud7a9d.getDefaultDocType(editor);
			header += `\n<html>\n<head>\n`;
			if (value = $_4aeordbdjdud7a9d.getDefaultTitle(editor)) {
				header += "<title>" + value + "</title>\n";
			}
			if (value = $_4aeordbdjdud7a9d.getDefaultEncoding(editor)) {
				header += "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=" + value + "\" />\n";
			}
			if (value = $_4aeordbdjdud7a9d.getDefaultFontFamily(editor)) {
				styles += "font-family: " + value + ";";
			}
			if (value = $_4aeordbdjdud7a9d.getDefaultFontSize(editor)) {
				styles += "font-size: " + value + ";";
			}
			if (value = $_4aeordbdjdud7a9d.getDefaultTextColor(editor)) {
				styles += "color: " + value + ";";
			}
			header += "</head>\n<body" + (styles ? " style=\"" + styles + "\"" : "") + ">\n";
			return header;
		};
		const handleGetContent = function (editor, head, foot, evt) {
			if (!evt.selection && (!evt.source_view || !$_4aeordbdjdud7a9d.shouldHideInSourceView(editor))) {
				evt.content = $_73m398bfjdud7a9l.unprotectHtml(Tools.trim(head) + "\n" + Tools.trim(evt.content) + "\n" + Tools.trim(foot));
			}
		};
		const setup = function (editor, headState, footState) {
			// editor.on("Undo", event => {
			// });
			editor.on("BeforeSetContent", event => {

				let pagemode = editor.getParam("fullpage_pagemode", "body");
				if (editor.settings.modifyingCode) {
					if (!editor.settings.fullpage_ignoreswitch) {
						if (pagemode !== "body" && !event.content.match(/<html.*?>/)) {
							pagemode = "body";
							headState.set("");
							editor.settings.fullpage_pagemode = pagemode;
						}
						else if (pagemode === "body" && event.content.match(/<html.*?>/)) {
							headState.set(event.content.substring(0, event.content.indexOf("</body>")));
							pagemode = event.content.match(/^<!DOCTYPE[^>]+XHTML.*?>/ig) ? "xhtml" : "html";
							editor.settings.fullpage_pagemode = pagemode;
						}
					}
				}

				if (pagemode !== "body") {
					handleSetContent(editor, headState, footState, event);
				}
			});
			editor.on("GetContent", (evt) => {
				let pagemode = editor.getParam("fullpage_pagemode", "body");
				if (pagemode !== "body") {
					handleGetContent(editor, headState.get(), footState.get(), evt);
				}
			});
		};
		const $_101dyabejdud7a9g = {setup};

		const register$1 = function (editor) {
			editor.addButton("fullpage", {
				title: "Document properties",
				cmd: "mceFullPageProperties",
			});
			editor.addMenuItem("fullpage", {
				text: "Document properties",
				cmd: "mceFullPageProperties",
				context: "file",
			});
		};
		const $_g8k18qbgjdud7a9m = {register: register$1};

		PluginManager.add("fullpage", (editor) => {
			const headState = Cell("");
			const footState = Cell("");
			$_9bxf9tb6jdud7a8z.register(editor, headState);
			$_g8k18qbgjdud7a9m.register(editor);
			$_101dyabejdud7a9g.setup(editor, headState, footState);
		});
		function Plugin () {
		}

		return Plugin;

	})();
})();
