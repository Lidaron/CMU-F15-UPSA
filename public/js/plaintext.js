/**
 * Returns the style for a node.
 *
 * @param n The node to check.
 * @param p The property to retrieve (usually 'display').
 * @link http://www.quirksmode.org/dom/getstyles.html
 */
Node.prototype.getStyle = function (p) {
	return this.currentStyle ?
		this.currentStyle[p] :
		document.defaultView.getComputedStyle(this, null).getPropertyValue(p);
}

/**
* Converts HTML to text, preserving semantic newlines for block-level
* elements.
*
* @param node - The HTML node to perform text extraction.
*/
Node.prototype.toText = function () {
	var result = '';

	if (this.nodeType == document.TEXT_NODE) {
		// Replace repeated spaces, newlines, and tabs with a single space.
		result = this.nodeValue.replace(/\s+/g, ' ');
	} else {
		for (var i = 0, j = this.childNodes.length; i < j; i++) {
			result += this.childNodes[i].toText();
		}

		var d = this.getStyle('display');

		if (d.match(/^block/) || d.match(/list/) || d.match(/row/) ||
			this.tagName == 'BR' || this.tagName == 'HR') {
			result += '\n';
		} else if (d.match(/^none/)) {
			return '';
		}
	}

	return result.replace(/(^\ +)|(\ +$)/g, '');
}
