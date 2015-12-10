window.addEventListener('load', function load() {
	window.removeEventListener('load', load, false);
	setTimeout(function () {
		document.documentElement.classList.remove('preload');
	}, 0);
	
	var menu = document.getElementById("app-menu");
	menu.addEventListener('click', function (e) {
		if (!e.target.classList.contains("menu-link")) return;
		menu.classList.toggle("focus");
	});
	
	(function () {
		var menuClicked = true;
		menu.addEventListener('mousedown', function (e) {
			menuClicked = true;
		});
		document.body.addEventListener('mousedown', function (e) {
			if (!menuClicked)
				menu.classList.remove("focus");
			menuClicked = false;
		});
	}());
	
	Waves.attach('header .link', ['waves-button', 'waves-circle']);
	Waves.attach('#composer-header a, #composer-header button', ['waves-button', 'waves-circle']);
	Waves.attach('#utils a, #utils label', ['waves-button', 'waves-circle']);
    Waves.init({ duration: 200 });
}, false);
