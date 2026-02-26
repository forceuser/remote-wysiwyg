export default function githubAlerts (turndownService) {
	/** Extract the alert type from the element's class list, e.g. "note" from "markdown-alert-note". */
	function getAlertType (node) {
		for (const cls of node.classList) {
			const m = cls.match(/^markdown-alert-(.+)$/);
			if (m && cls !== 'markdown-alert' && !cls.startsWith('markdown-alert-oneliner')) {
				return m[1];
			}
		}
		return null;
	}

	/** Check if alert is a one-liner by checking for the class */
	function isOneLiner (node) {
		return node.classList.contains('markdown-alert-oneliner');
	}

	/** Prefix each line of text with "> " for blockquote formatting */
	function prefixLines (text) {
		return text.split('\n').map(line => line).join('\n> ');
	}

	turndownService.addRule('githubAlerts', {
		filter: (node) => {
			if (node.nodeName !== 'DIV') return false;
			if (!node.classList.contains('markdown-alert')) return false;
			return getAlertType(node) !== null;
		},
		replacement: (content, node) => {
			const alertType = getAlertType(node);
			const typeStr   = alertType.toUpperCase();
			const isOneline = isOneLiner(node);

			// Read the title element and convert its HTML to markdown (preserves links, formatting)
			const titleEl = node.querySelector(':scope > p.markdown-alert-title');
			let titleText = '';
			if (titleEl) {
				// Clone and remove the icon SVG if present
				const titleClone = titleEl.cloneNode(true);
				const svg = titleClone.querySelector('svg');
				if (svg) svg.remove();
				// Convert remaining HTML to markdown
				titleText = turndownService.turndown(titleClone.innerHTML).trim();
			}

			const defaultLabel = alertType.charAt(0).toUpperCase() + alertType.slice(1);
			// Only emit inline title when it differs from the default capitalised type name
			const inlineTitle = titleText && titleText !== defaultLabel ? ` ${titleText}` : '';

			// One-liner: has the oneliner class, custom title inline, no body content
			if (isOneline) {
				return `> [!${typeStr}]${inlineTitle}\n\n`;
			}

			// Collect all body elements (paragraphs, lists, blockquotes, etc.) after title
			const bodyElements = Array.from(node.children).filter(child => 
				!child.classList.contains('markdown-alert-title')
			);

			let bodyContent = '';
			bodyElements.forEach((element, index) => {
				const markdown = turndownService.turndown(element.outerHTML).trim();
				if (!markdown) return;

				if (index === 0) {
					// First element - prefix all lines
					bodyContent += prefixLines(markdown);
				} else {
					// Subsequent elements - add separator and prefix
					bodyContent += '\n>\n> ' + prefixLines(markdown);
				}
			});

			// If no body content, still format properly
			if (!bodyContent) {
				return `> [!${typeStr}]${inlineTitle}\n\n`;
			}

			return `> [!${typeStr}]${inlineTitle}\n> ${bodyContent}\n\n`;
		}
	});
}
