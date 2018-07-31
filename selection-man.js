function dehydrateRange (range) {
	if (range) {
		return {
			startContainer: range.startContainer,
			startOffset: range.startOffset,
			endContainer: range.endContainer,
			endOffset: range.endOffset,
		};
	}
	return null;
}

function hydrateRange (window, range) {
	if (range) {
		const newRange = window.document.createRange();
		newRange.setStart(range.startContainer, range.startOffset);
		newRange.setEnd(range.endContainer, range.endOffset);
		return newRange;
	}
	return null;
}

export default function (window) {
	const document = window.document;
	let saveSelection;
	let restoreSelection;
	let saveAbsSelection;
	let restoreAbsSelection;

	saveSelection = () => {
		if (window.getSelection) {
			const sel = window.getSelection();
			if (sel.getRangeAt && sel.rangeCount) {
				return dehydrateRange(sel.getRangeAt(0));
			}
		}
		else if (document.selection && document.selection.createRange) {
			return document.selection.createRange();
		}
		return null;
	};

	restoreSelection = range => {
		range = hydrateRange(range);
		if (range) {
			if (window.getSelection) {
				const sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
			else if (document.selection && range.select) {
				range.select();
			}
		}
	};

	if (window.getSelection && document.createRange) {
		saveAbsSelection = function (containerEl) {
			const range = window.getSelection().getRangeAt(0);
			const preSelectionRange = range.cloneRange();
			preSelectionRange.selectNodeContents(containerEl);
			preSelectionRange.setEnd(range.startContainer, range.startOffset);
			const start = preSelectionRange.toString().length;

			return {
				start,
				end: start + range.toString().length,
			};
		};

		restoreAbsSelection = function (containerEl, savedSel) {
			let charIndex = 0;
			const range = document.createRange();
			range.setStart(containerEl, 0);
			range.collapse(true);
			const nodeStack = [containerEl];
			let node;
			let foundStart = false;
			let stop = false;

			while (!stop && (node = nodeStack.pop())) {
				if (node.nodeType == 3) {
					const nextCharIndex = charIndex + node.length;
					if (
						!foundStart &&
						savedSel.start >= charIndex &&
						savedSel.start <= nextCharIndex
					) {
						range.setStart(node, savedSel.start - charIndex);
						foundStart = true;
					}
					if (
						foundStart &&
						savedSel.end >= charIndex &&
						savedSel.end <= nextCharIndex
					) {
						range.setEnd(node, savedSel.end - charIndex);
						stop = true;
					}
					charIndex = nextCharIndex;
				}
				else {
					let i = node.childNodes.length;
					while (i--) {
						nodeStack.push(node.childNodes[i]);
					}
				}
			}

			const sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		};
	}
	else if (document.selection) {
		saveAbsSelection = function (containerEl) {
			const selectedTextRange = document.selection.createRange();
			const preSelectionTextRange = document.body.createTextRange();
			preSelectionTextRange.moveToElementText(containerEl);
			preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
			const start = preSelectionTextRange.text.length;

			return {
				start,
				end: start + selectedTextRange.text.length,
			};
		};

		restoreAbsSelection = function (containerEl, savedSel) {
			const textRange = document.body.createTextRange();
			textRange.moveToElementText(containerEl);
			textRange.collapse(true);
			textRange.moveEnd("character", savedSel.end);
			textRange.moveStart("character", savedSel.start);
			textRange.select();
		};
	}

	return {
		saveSelection,
		restoreSelection,
		saveAbsSelection,
		restoreAbsSelection,
	};
}
