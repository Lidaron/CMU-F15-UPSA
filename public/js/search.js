window.addEventListener('load', function load(e) {
	var $searchform = document.getElementById("search-form");

	var $searchbox = document.getElementById("search-box");
	$searchbox.addEventListener("blur", function (e) {
		if ($searchbox.value.trim() !== "") return;
		$searchbox.value = "";
		document.body.classList.remove("search-open");
	});
	
	var $header = document.getElementsByTagName("header")[0];
	$header.addEventListener("click", function (e) {
		if (!e.target.classList.contains("search-link")) return;
		if (!document.body.classList.contains("search-open")) {
			$searchbox.value = "";
			document.body.classList.add("search-open");
			$searchbox.focus();
			return;
		}
		doSearch("");
		document.body.classList.remove("search-open");
	});

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
	
	function doSearch(query) {
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
	
	function handleSearch(e) {
		if (e.type === "submit") {
			e.preventDefault();
		}
		var query = $searchbox.value.trim();
		doSearch(query)
	}
	
	$searchform.addEventListener("submit", handleSearch);
	$searchbox.addEventListener("input", handleSearch);
	handleSearch(e);
}, false);
