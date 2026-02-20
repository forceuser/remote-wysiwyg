/**
 * markdown-it plugin for GitHub-style alerts.
 *
 * Converts blockquotes beginning with `[!TYPE]` into alert divs:
 *
 *   > [!NOTE]
 *   > Some text
 *
 * becomes:
 *
 *   <div class="markdown-alert markdown-alert-note">
 *     <p class="markdown-alert-title" dir="auto"><!-- svg -->Note</p>
 *     <p>Some text</p>
 *   </div>
 *
 * One-liner shorthand also supported:
 *
 *   > [!NOTE] Short inline text
 *
 * which adds the extra class `markdown-alert-oneliner`.
 *
 * @param {import('markdown-it')} md
 * @param {object}  [options]
 * @param {object}  [options.types]   Map of additional or overriding type definitions.
 *                                    Keys are lower-case type names; values are
 *                                    `{ label, icon }` objects.
 * @param {boolean} [options.ignoreUnknownTypes=true]  Skip blockquotes whose type
 *                                    is not in the type map.
 */

// ------------------------------------------------------------
// GitHub Octicon SVGs (inline, 16 × 16)
// ------------------------------------------------------------
const ICONS = {
	note: `<svg class="octicon octicon-info" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path stroke="currentColor" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`,
	tip: `<svg class="octicon octicon-lightbulb" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path stroke="currentColor" d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>`,
	important: `<svg class="octicon octicon-report" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path stroke="currentColor" d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>`,
	warning: `<svg class="octicon octicon-alert" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path stroke="currentColor" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>`,
	caution: `<svg class="octicon octicon-stop" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path stroke="currentColor" d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`,
};

// Default type definitions
const DEFAULT_TYPES = {
	note:      { label: 'Note',      icon: ICONS.note },
	tip:       { label: 'Tip',       icon: ICONS.tip },
	important: { label: 'Important', icon: ICONS.important },
	warning:   { label: 'Warning',   icon: ICONS.warning },
	caution:   { label: 'Caution',   icon: ICONS.caution },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/** Find the index of the matching blockquote_close for bqStart. */
function findBlockquoteClose (tokens, bqStart) {
	let depth = 0;
	for (let j = bqStart; j < tokens.length; j++) {
		if (tokens[j].type === 'blockquote_open')  depth++;
		if (tokens[j].type === 'blockquote_close') {
			depth--;
			if (depth === 0) return j;
		}
	}
	return -1;
}

/** Count inline (paragraph) tokens directly inside a blockquote span. */
function countInlineTokens (tokens, bqStart, bqEnd) {
	let count = 0;
	let depth = 0;
	for (let j = bqStart; j <= bqEnd; j++) {
		if (tokens[j].type === 'blockquote_open')  depth++;
		if (tokens[j].type === 'blockquote_close') depth--;
		// Only count direct children (depth === 1 means we are inside the bq but not a nested bq)
		if (depth === 1 && tokens[j].type === 'inline') count++;
	}
	return count;
}

/**
 * Find the first inline token that is a direct child of the blockquote.
 * (Skips tokens belonging to nested blockquotes.)
 */
function findFirstDirectInline (tokens, bqStart, bqEnd) {
	let depth = 0;
	for (let j = bqStart; j <= bqEnd; j++) {
		if (tokens[j].type === 'blockquote_open')  depth++;
		if (tokens[j].type === 'blockquote_close') depth--;
		if (depth === 1 && tokens[j].type === 'inline') return j;
	}
	return -1;
}

// ------------------------------------------------------------
// Plugin
// ------------------------------------------------------------

export default function alertsPlugin (md, options = {}) {
	const ignoreUnknown = options.ignoreUnknownTypes !== false; // default true

	// Merge built-in types with user-supplied ones (user wins)
	const alertTypes = Object.assign({}, DEFAULT_TYPES, options.types || {});

	md.core.ruler.push('github_alerts', (state) => {
		const tokens = state.tokens;
		let i = 0;

		while (i < tokens.length) {
			if (tokens[i].type !== 'blockquote_open') {
				i++;
				continue;
			}

			const bqStart = i;
			const bqEnd   = findBlockquoteClose(tokens, bqStart);

			if (bqEnd === -1) { i++; continue; }

			// ---- Find the first direct inline (paragraph) token ----
			const firstInlineIdx = findFirstDirectInline(tokens, bqStart, bqEnd);
			if (firstInlineIdx === -1) { i++; continue; }

			const rawContent  = tokens[firstInlineIdx].content;
			const firstLine   = rawContent.split('\n')[0];

			// Match [!TYPE] with optional inline body on the same line
			// e.g.  "[!NOTE]"  or  "[!WARNING] short text"
			const headerMatch = firstLine.match(/^\[!([\w-]+)\][ \t]?(.*)?$/);
			if (!headerMatch) { i++; continue; }

			const typeKey    = headerMatch[1].toLowerCase();
			const typeInfo   = alertTypes[typeKey];

			if (!typeInfo && ignoreUnknown) { i++; continue; }

			// ---- Determine content sections ----

			// Text on the same line as [!TYPE] → used as title override
			const sameLine   = (headerMatch[2] || '').trim();
			// Remaining lines of the opening paragraph (after the [!TYPE] line)
			const nlPos      = rawContent.indexOf('\n');
			const restLines  = nlPos !== -1 ? rawContent.slice(nlPos + 1) : '';

			// Count all direct inline tokens to detect one-liners
			const inlineCount = countInlineTokens(tokens, bqStart, bqEnd);

			// A one-liner: title on the [!TYPE] line, no body text at all
			const isOneLiner = sameLine !== '' && restLines === '' && inlineCount === 1;

			// ---- Build the body first-paragraph content ----
			// restLines becomes the first paragraph; null means remove the empty paragraph
			const firstParaContent = restLines || null;

			// ---- Build replacement token list ----
			const newTokens = [];

			// Opening wrapper
			const label      = typeInfo ? typeInfo.label : typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
			// sameLine overrides the default label when present
			const titleText  = sameLine || label;
			const icon       = typeInfo ? (typeInfo.icon || '') : '';
			const extraClass = isOneLiner ? ' markdown-alert-oneliner' : '';

			const divOpenTok = new state.Token('html_block', '', 0);
			divOpenTok.content = `<div class="markdown-alert markdown-alert-${typeKey}${extraClass}">\n`;
			newTokens.push(divOpenTok);

			// Title paragraph
			const titleTok = new state.Token('html_block', '', 0);
			titleTok.content = `<p class="markdown-alert-title" dir="auto">${icon}${titleText}</p>\n`;
			newTokens.push(titleTok);

			// Body tokens (everything between bqStart+1 and bqEnd-1, minus old blockquote wrappers)
			// We skip the original first `paragraph_open / inline / paragraph_close` triple
			// and replace it with a modified one (or remove it if content is empty).
			let skipFirstPara = false; // set true once we've handled/replaced the first paragraph

			for (let j = bqStart + 1; j < bqEnd; j++) {
				const tok = tokens[j];

				if (!skipFirstPara && tok.type === 'paragraph_open') {
					// Handle first paragraph: replace its inline content
					if (firstParaContent === null) {
						// Empty first paragraph ([!TYPE] alone, rest in separate paragraphs)
						// Skip paragraph_open, inline, paragraph_close
						skipFirstPara = true;
						j += 2; // skip inline + paragraph_close
						continue;
					}

					// Emit paragraph_open
					newTokens.push(tok);
					j++; // advance to inline token

					// Replace inline content
					const newInline    = new state.Token('inline', '', 0);
					newInline.content  = firstParaContent;
					newInline.children = [];
					// Inline tokens created after the inline-parse phase need their
					// children populated manually. The 4th arg must be the children array.
					state.md.inline.parse(newInline.content, state.md, state.env, newInline.children);
					newTokens.push(newInline);
					j++; // advance to paragraph_close

					newTokens.push(tokens[j]); // paragraph_close
					skipFirstPara = true;
					continue;
				}

				newTokens.push(tok);
			}

			// Closing wrapper
			const divCloseTok = new state.Token('html_block', '', 0);
			divCloseTok.content = `</div>\n`;
			newTokens.push(divCloseTok);

			// Replace the original blockquote token range in-place
			tokens.splice(bqStart, bqEnd - bqStart + 1, ...newTokens);

			// Continue scanning after the inserted tokens
			i = bqStart + newTokens.length;
		}
	});
}
