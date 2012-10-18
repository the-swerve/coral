$(document).ready(function() {

	var signing_in = false;
	var creating_account = false;

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
				success: function(d) {
					$.cookie('coral.session_token', d.session_token);
					window.location = '/';
				},
				error: function(d) {
					$('p#greetings-message').html(d.responseText);
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
				success: function(d) {
					$.cookie('coral.session_token', d.session_token);
					$('form#welcome-form').fadeOut(function() {$('form#first-plan-form').fadeIn()});
					$('a#switch-contexts').fadeOut();
				},
				error: function(data) {
					$('p#greetings-message').html(data.responseText);
					$('p#greetings-message').css('color', '#944E4E');
					$('input.welcome-submit').attr('value','Create Account');
					$('input.welcome-submit').attr('class','btn welcome-submit');
					creating_account = false;
				}
			});
		}
	});

	// Submit first plan
	$('#first-plan-submit').click(function(e) {
		e.preventDefault();
		$(this).hide();
		$('#first-plan-loader').show();
		var data = $('#first-plan-form').serializeObject();
		$.ajax({
			type: 'post',
			url: '/plans',
			dataType: 'json',
			data: $('form#first-plan-form').serializeObject(),
			success: function(d) {
				window.location = '/';
			},
			error: function(d) {
				$('p#first-plan-error').html(d.responseText);
				$('#first-plan-loader').hide();
				$('#first-plan-submit').show();
			}
		});
	});

	// A little logo hover fade effect
	$('a.logo').hover(function(event) {
			$(this).fadeTo('fast',1);
		}, function(event) {
			$(this).fadeTo('fast',0.6);
	});

});
