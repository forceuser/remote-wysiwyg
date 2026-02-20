// markdown-it plugin: renders GFM task list items
// Converts `- [ ] item` / `- [x] item` into <li> with <input type="checkbox">

const PATTERN = /^\[([ xX])\]\s+/;

export default function checklistPlugin (md) {
	md.core.ruler.after("inline", "task_list", (state) => {
		const tokens = state.tokens;

		for (let i = 2; i < tokens.length; i++) {
			if (!isTaskListItem(tokens, i)) {
				continue;
			}

			const inlineToken = tokens[i];
			const children = inlineToken.children;
			if (!children || !children.length) {
				continue;
			}

			const firstChild = children[0];
			if (firstChild.type !== "text") {
				continue;
			}

			const match = firstChild.content.match(PATTERN);
			if (!match) {
				continue;
			}

			const checked = match[1].toLowerCase() === "x";

			// Strip the `[ ] ` / `[x] ` prefix from the text node
			firstChild.content = firstChild.content.slice(match[0].length);

			// Build the checkbox HTML token and prepend it to children
			const checkbox = new state.Token("html_inline", "", 0);
			checkbox.content = checked
				? `<input type="checkbox" checked disabled> `
				: `<input type="checkbox" disabled> `;
			children.unshift(checkbox);

			// Mark the <li> with a class for CSS targeting
			const liOpenToken = tokens[i - 2];
			liOpenToken.attrSet("class", "task-list-item");

			// Mark the parent <ul> with a class for CSS targeting
			for (let j = i - 3; j >= 0; j--) {
				if (tokens[j].type === "bullet_list_open") {
					tokens[j].attrSet("class", "task-list");
					break;
				}
			}
		}
	});
}

function isTaskListItem (tokens, index) {
	// tokens[index]     = inline  (the list item content)
	// tokens[index - 1] = list_item_open
	// tokens[index - 2] = list_item_open (or bullet_list_open deeper)
	// We need: inline preceded by paragraph_open preceded by list_item_open
	return (
		tokens[index].type === "inline" &&
		tokens[index - 1].type === "paragraph_open" &&
		tokens[index - 2].type === "list_item_open"
	);
}
