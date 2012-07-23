
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

	// Clickable rows for person profiles
	// TODO generalize this
	//$('div#profile-settings-dialog').bootstrap_dialog({title: "Profile Settings", autoOpen: false});
	$('table.clickable-rows tr').click(function(event) {
		event.preventDefault();
		$('p.form-error').html('');
		$('input#edit-profile-name').attr('value', $(this).children('td.profile-name').html());
		$('input#edit-profile-email').attr('value', $(this).children('td.profile-email').html());
		$('input#edit-profile-id').attr('value', $(this).attr('id'));
		$('div#edit-profile').modal('show');
	});
	// Since we have to hide the edit-plan modal, we can't use modalize
	//
	modalize('settings');
	modalize('new-profile');
	modalize('edit-profile');

});
