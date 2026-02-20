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

	turndownService.addRule('githubAlerts', {
		filter: (node) => {
			if (node.nodeName !== 'DIV') return false;
			if (!node.classList.contains('markdown-alert')) return false;
			return getAlertType(node) !== null;
		},
		replacement: (content, node) => {
			const alertType = getAlertType(node);
			const typeStr   = alertType.toUpperCase();

			// Read the title element text (covers custom label overrides)
			const titleEl    = node.querySelector(':scope > p.markdown-alert-title');
			const titleText  = titleEl ? titleEl.textContent.trim() : '';
			const defaultLabel = alertType.charAt(0).toUpperCase() + alertType.slice(1);
			// Only emit inline title when it differs from the default capitalised type name
			const inlineTitle = titleText && titleText !== defaultLabel ? ` ${titleText}` : '';

			const paragraphs = node.querySelectorAll(':scope > p:not(.markdown-alert-title)');
			let bodyContent = '';
			paragraphs.forEach((p, index) => {
				const text = turndownService.turndown(p.innerHTML);
				if (index === 0) {
					bodyContent += text;
				} else {
					bodyContent += '\n>\n> ' + text;
				}
			});

			// One-liner: custom inline title, no body
			if (inlineTitle && !bodyContent) {
				return `> [!${typeStr}]${inlineTitle}\n\n`;
			}

			return `> [!${typeStr}]${inlineTitle}\n> ${bodyContent}\n\n`;
		}
	});
}
