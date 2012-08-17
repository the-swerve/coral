$(document).ready(function() {

	$('#edit-profile-settings').toggle(function(e) {
		$('div.profile-settings').slideDown('slow');
	},
	function(e) {
		$('div.profile-settings').slideUp('slow');
	});

});
