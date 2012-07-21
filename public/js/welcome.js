$(document).ready(function() {

	var signing_in = false;
	var creating_account = false;

	$('form#welcome-form').attr('action', api_url + '/signin');

	// Welcome page
	// Switch sign in/up contexts
	$('a#switch-contexts').toggle(function(event) {
		if(!signing_in && !creating_account) {
			$(this).fadeOut('fast', function() {
				$(this).html('Sign In');
				$(this).fadeIn('fast');
			});
			$('p#greetings-message').fadeOut('fast', function() {
				$('p#greetings-message').css('color', 'black');
				$('p#greetings-message').html('Create a new account');
				$('p#greetings-message').fadeIn('fast');
			});
			$('input.welcome-submit').fadeOut('fast', function() {
				$('input.welcome-submit').attr('value', 'Create Account');
				$('input.welcome-submit').fadeIn('fast');
				$('input.welcome-submit').attr('class', 'btn welcome-submit');
			});
			$('form#welcome-form').attr('action', api_url + '/account');
		}
	},
	function() {
		if (!signing_in && !creating_account) {
			$(this).fadeOut('fast', function() {
				$(this).html('New Account');
				$(this).fadeIn('fast');
			});
			$('p#greetings-message').fadeOut('fast', function() {
				$('p#greetings-message').html('Please sign in');
				$('p#greetings-message').fadeIn('fast');
			});
			$('input.welcome-submit').fadeOut('fast', function() {
				$('input.welcome-submit').attr('value','Sign In');
				$('input.welcome-submit').fadeIn('fast');
				$('input.welcome-submit').attr('class', 'btn welcome-submit');
			});
			$('form#welcome-form').attr('action', api_url + '/signin');
		}
	});

	// Welcome page form submit
	$('input.welcome-submit').bind('click',function(event) {
		event.preventDefault();
		// Signing in
		if($(this).attr('value') == 'Sign In') { // XXX bleh
			signing_in = true;
			$('input.welcome-submit').attr('value','Authenticating...');
			$('input.welcome-submit').attr('class','btn welcome-submit disabled');
			$.ajax({
				type: 'POST',
				url: '/',
				dataType: 'json',
				data: {auth: $('form#welcome-form').serializeObject()},
				success: function(data) {
					if(data.success) {
						$.cookie('coral.session_token', data.session_token);
						window.location = '/';
					} else {
						$('p#greetings-message').html('Invalid email or password.');
						$('p#greetings-message').css('color', '#944E4E');
						$('input.welcome-submit').attr('value','Sign In');
						$('input.welcome-submit').attr('class','btn welcome-submit');
						signing_in = false;
					}
				},
				error: function() {
					$('p#greetings-message').html('Invalid account.');
					$('p#greetings-message').css('color', '#944E4E');
					$('input.welcome-submit').attr('value','Sign In');
					$('input.welcome-submit').attr('class','btn welcome-submit');
					signing_in = false;
				}
			});
		}
		// Creation of an account.
		else if($(this).attr('value') == 'Create Account') { // XXX bleh
			creating_account = true;
			$('input.welcome-submit').attr('value','Creating Account...');
			$('input.welcome-submit').attr('class','btn welcome-submit disabled');
			$.ajax({
				type: 'POST',
				url: '/account',
				dataType: 'json',
				data: $('form#welcome-form').serialize(),
				success: function(data) {
					if(data.success) {
						$.cookie('coral.session_token', data.session_token);
						window.location = '/';
					} else if (data.error) {
						$('p#greetings-message').html(data.error);
						$('p#greetings-message').css('color', '#944E4E');
						$('input.welcome-submit').attr('value','Create Account');
						$('input.welcome-submit').attr('class','btn welcome-submit');
						$(this).unbind('click');
						creating_account = false;
					} else {
						$('p#greetings-message').html('There was an error. :/');
						$('p#greetings-message').css('color', '#944E4E');
						$('input.welcome-submit').attr('value','Create Account');
						$('input.welcome-submit').attr('class','btn welcome-submit');
						creating_account = false;
					}
				},
				error: function() {
					$('p#greetings-message').html('There was an error. :(');
					$('p#greetings-message').css('color', '#944E4E');
					$('input.welcome-submit').attr('value','Create Account'); // XXX redundant
					$('input.welcome-submit').attr('class','btn welcome-submit');
					creating_account = false;
				}
			});
		}
	});

	// A little logo hover fade effect
	$('a.logo').hover(function(event) {
			$(this).fadeTo('fast',0.6);
		}, function(event) {
			$(this).fadeTo('fast',1);
	});

});
