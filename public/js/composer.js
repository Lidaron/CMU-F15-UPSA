var form = document.getElementById("composer");
var discard = document.getElementById("composer-discard");
var btn = document.getElementById("composer-submit");
var html = document.getElementById("composer-page");
var text = document.getElementById("composer-text");
btn.addEventListener("click", function (e) {
	e.preventDefault();
	text.value = html.innerText;
	form.submit();
});
discard.addEventListener("click", function (e) {
	if (html.innerText.length < 10) return;
	if (confirm("Are you sure you want to discard this entry?")) return;
	e.preventDefault();
});
window.addEventListener("load", function () {
	var x = window.scrollX, y = window.scrollY;
	html.focus();
	window.scrollTo(x, y);
});

function supportsPlainText() {
    var d = document.createElement("div");
    try {
        d.contentEditable="PLAINtext-onLY";
    } catch(e) {
        return false;
    }
    return d.contentEditable=="plaintext-only";
}

if (supportsPlainText()) {
	html.setAttribute("contenteditable", "plaintext-only");
}
