export default function githubAlerts (turndownService) {
	const alertTypes = ['note', 'tip', 'important', 'warning', 'caution'];

	turndownService.addRule('githubAlerts', {
		filter: (node) => {
			if (node.nodeName !== 'DIV') return false;
			if (!node.classList.contains('markdown-alert')) return false;
			for (const type of alertTypes) {
				if (node.classList.contains(`markdown-alert-${type}`)) return true;
			}
			return false;
		},
		replacement: (content, node) => {
			let alertType = '';
			for (const type of alertTypes) {
				if (node.classList.contains(`markdown-alert-${type}`)) {
					alertType = type.toUpperCase();
					break;
				}
			}

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

			return `> [!${alertType}]\n> ${bodyContent}\n\n`;
		}
	});
}
