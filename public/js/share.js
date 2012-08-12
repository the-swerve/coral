var req = false; // request blocker
$(document).ready(function() {

	// Sign up form submit
	$('input#share-signup-submit').bind('click',function(event) {
		event.preventDefault();
		if (req == false) {
			req = true;
			// Signing in
			$('input#share-signup-submit').attr('value','Signing Up...');
			$('input#share-signup-submit').addClass('disabled');
			var account = $('input#account-id').attr('value');
			$.ajax({
				type: 'POST',
				url: '/account/' + account + '/profiles',
				dataType: 'json',
				data: $('form#share-signup-form').serializeObject(),
				success: function(data) {
					$.cookie('coral.session_token', data.session_token);
					window.location = '/';
					req = false;
				},
				error: function(d) {
					$('p#share-plan-error').html(d.responseText);
					$('input#share-signup-submit').attr('value','Sign Up'); // XXX redundant
					$('input#share-signup-submit').removeClass('disabled');
					req = false;
				}
			});
		}
	});

	$('#signup-title').toggle(function(e) {
		e.preventDefault();
		$('#share-signup').slideDown('slow');
		$(this).slideUp('slow');
	}, function(e) {
		e.preventDefault();
	});

	$('.new-payment-method-type').change(function(e) {
		var sel = $('.new-payment-method-type option:selected').text();
		if(sel == 'Credit Card') {
			$('.echeck-selected').hide(function() {
				$('.credit-card-selected').slideDown('slow');
			});
		} else if(sel == 'E-check') {
			$('.credit-card-selected').hide(function() {
				$('.echeck-selected').slideDown('slow');
			});
		} else if(sel == '') {
			$('.credit-card-selected').hide();
			$('.echeck-selected').hide();
		}
	});

});
