window.addEventListener('load', function load(e) {
	var $searchform = document.getElementById("search-form");
	var $searchbox = document.getElementById("search-box");

	function matchQuery(text, terms) {
		var tokens = text.toLowerCase().split(/\s+/);
		for (var i = 0; i < terms.length; i++) {
			var found = false;
			for (var j = 0; j < tokens.length; j++) {
				if (tokens[j].indexOf(terms[i]) !== 0) continue;
				found = true;
				break;
			}
			if (found) continue;
			return false;
		}
		return true;
	}
	
	function doSearch(e) {
		if (e.type === "submit") {
			e.preventDefault();
		}

		var query = $searchbox.value.trim();
		if (query === "") {
			document.body.classList.remove("search-results");
		} else {
			document.body.classList.add("search-results");
		}

		var terms = query.toLowerCase().split(/\s+/);
		var $sections = document.getElementsByClassName("journal-section");
		for (var i = 0; i < $sections.length; i++) {
			var $section = $sections[i];
			var text = $section.getElementsByClassName("journal-text")[0].innerText;
			console.log(text);
			if (matchQuery(text, terms)) {
				$section.classList.remove("search-not-matched");
			} else {
				$section.classList.add("search-not-matched");
			}
		}
	}
	
	$searchform.addEventListener("submit", doSearch);
	$searchbox.addEventListener("input", doSearch);
	doSearch(e);
}, false);
