export default function checklistPlugin (turndownService) {
	// Handle individual task list items
	turndownService.addRule('taskListItem', {
		filter: (node) => {
			if (node.nodeName !== 'LI') return false;
			const checkbox = node.querySelector(':scope > input[type="checkbox"]');
			return checkbox !== null;
		},
		replacement: (content, node) => {
			const checkbox = node.querySelector(':scope > input[type="checkbox"]');
			const checked = checkbox.checked || checkbox.hasAttribute('checked');
			const mark = checked ? '[x]' : '[ ]';

			// Strip the checkbox from content (turndown may have converted it or left it)
			const text = content
				.replace(/^\s*\[[ xX]\]\s*/m, '') // remove if turndown already rendered it
				.replace(/^\s*/, '')               // trim leading whitespace
				.replace(/\n/g, '\n    ');         // indent continuation lines

			return `- ${mark} ${text}\n`;
		}
	});

	// Prevent the checkbox input itself from producing output
	turndownService.addRule('taskListCheckbox', {
		filter: (node) => {
			if (node.nodeName !== 'INPUT') return false;
			if (node.getAttribute('type') !== 'checkbox') return false;
			const parent = node.parentNode;
			return parent && parent.nodeName === 'LI';
		},
		replacement: () => ''
	});
}
