$(document).ready(function() {

	$('#edit-profile-button').toggle(function(e) {
		$('div.profile-settings').slideDown('slow');
	},
	function(e) {
		$('div.profile-settings').slideUp('slow');
	});

	$('#close-profile-settings').click(function(e) {
		e.preventDefault();
		$('div.profile-settings').slideUp('slow');
	});

	$('#edit-profile-submit').click(function(e) {
		e.preventDefault();
		$(this).hide();
		$(this).siblings().hide();
		$('#edit-profile-loader').show();
		var self = this;

		$.ajax({
			type: 'put',
			url: '/profile',
			dataType: 'json',
			data: $('form#edit-profile').serializeObject(),
			success: function(d) {
				window.location = '/';
			},
			error: function(d) {
				$(self).show();
				$(self).siblings().show();
				$('#edit-profile-loader').hide();
				$('p#edit-profile-error').html(d.responseText);
			}
		});
	});

});
