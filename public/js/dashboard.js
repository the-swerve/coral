
_.templateSettings = {
	interpolate: /\{\{(.+?)\}\}/g,
	evaluate: /\[\[(.+?)\]\]/g
}

// XXX this could probably be put into the backbone views
function modalize(prefix) {
	$('a#' + prefix + '-button').click(function(e) {
		e.preventDefault();
		$('p#' + prefix + '-error').html(''); // Make sure form errors are blank
		$('div#' + prefix).modal('show');
	});
};


$(document).ready(function() {


	$('a#get-help').tooltip({placement: 'bottom'});
	$('a#settings-button').tooltip({placement: 'bottom'});
	$('a#logout-button').tooltip({placement: 'bottom'});
	$('.auto-tooltip').tooltip({placement: 'bottom'});
	$('.auto-tooltip-top').tooltip({placement: 'top'});

	// TODO put into AccountView
	modalize('settings');


});
