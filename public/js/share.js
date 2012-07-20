$(document).ready(function() {

	// Sign up form submit
	$('input#signup-submit').bind('click',function(event) {
		event.preventDefault();
		// Signing in
		$('input#signup-submit').attr('value','Signing Up...');
		$('input#signup-submit').attr('class','btn disabled');
		var account = $('input#account-id').attr('value');
		$.ajax({
			type: 'POST',
			url: '/account/' + account + '/profiles',
			dataType: 'json',
			data: {profile: $('form#signup-form').serializeObject()},
			success: function(data) {
				if(data.session_token) {
					$.cookie('friendofthegrue', data.session_token);
					window.location = '/';
				} else if (data.error) {
					$('p#form-error').html(data.error);
					$('p#form-error').css('color', '#944E4E');
					$('input#signup-submit').attr('value','Sign Up');
					$('input#signup-submit').attr('class','btn');
				} else {
					$('p#form-error').html('There was an error. :/');
					$('p#form-error').css('color', '#944E4E');
					$('input.signup-submit').attr('value','Sign Up');
					$('input.signup-submit').attr('class','btn');
				}
			},
			error: function() {
				$('p#form-error').html('There was an error. :(');
				$('p#form-error').css('color', '#944E4E');
				$('input#signup-submit').attr('value','Sign Up'); // XXX redundant
				$('input#signup-submit').attr('class','btn');
			}
		});
	});
});
