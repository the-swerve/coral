
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

	// TODO put into AccountView
	modalize('settings');

	// Fade the payments/profiles tables in and out
	// Also, change the background color/highlight of selected button
	$('a.view-people-button').click(function(e) {
		e.preventDefault();
		$('a.view-payments-button').css('backgroundColor', 'transparent');
		$('a.view-payments-button').css('color', 'black');
		$(this).css('backgroundColor','gray');
		$(this).children('i').addClass('icon-white');
		$('div#charge').fadeOut(function() {
			$('div#profile').fadeIn();
		});
	});
	$('a.view-payments-button').click(function(e) {
		e.preventDefault();
		$('a.view-people-button').css('backgroundColor', 'transparent');
		$('a.view-people-button').children('i').removeClass('icon-white');
		$(this).css('backgroundColor','gray');
		$(this).css('color','white');
		$('div#profile').fadeOut(function() {
			$('div#charge').fadeIn();
		});
	});


});

balancedUri = 'TEST-MP761XGxjonKUa4HBnXOMoGy';
balancedUsername = 'e9234bfacc5211e1bda6026ba7e239a9';
balanced.init('/v1/marketplaces/' + balancedUri);
