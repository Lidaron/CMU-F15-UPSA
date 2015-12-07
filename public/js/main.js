window.addEventListener('load', function load() {
	window.removeEventListener('load', load, false);
	setTimeout(function () {
		document.documentElement.classList.remove('preload');
	}, 0);
	
	Waves.attach('.link', ['waves-button', 'waves-circle']);
	Waves.attach('#composer-header a, #composer-header button', ['waves-button', 'waves-circle']);
	Waves.attach('#utils a, #utils label', ['waves-button', 'waves-circle']);
    Waves.init({ duration: 200 });
}, false);
