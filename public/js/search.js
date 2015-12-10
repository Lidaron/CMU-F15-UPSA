window.addEventListener('load', function load(e) {
	var $searchform = document.getElementById("search-form");

	var $searchbox = document.getElementById("search-box");
	var $header = document.getElementsByTagName("header")[0];
	$header.addEventListener("click", function (e) {
		if (!e.target.classList.contains("search-link")) return;
		if (!document.body.classList.contains("search-open")) {
			$searchbox.value = "";
			document.body.classList.add("search-open");
			setTimeout(function () {
				$searchbox.focus();
			}, 100);
			return;
		}
		doSearch("");
		document.body.classList.remove("search-open");
	});
	
	var $journals = document.getElementsByClassName("journal-text");
	for (var i = 0; i < $journals.length; i++) {
		if ($journals[i].getElementsByClassName("more").length === 0) continue;
		$journals[i].classList.add("overflow");
	}

	function matchQuery(tokens, terms) {
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

			var tokens = [];
			var $nodes = $section.getElementsByClassName("searchable");
			for (var j = 0; j < $nodes.length; j++) {
				tokens = tokens.concat($nodes[j].innerText.toLowerCase().split(/\s+/));
			}

			console.log(tokens);
			if (matchQuery(tokens, terms)) {
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
