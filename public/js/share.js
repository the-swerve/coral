var Glob = {}; // I thought I might keep globals in this hash so they're more explicit and contained

$(document).ready(function() {

	// Sign up form submit
	$('input#share-signup-submit').bind('click',function(event) {
		event.preventDefault();
		// Signing in
		$('.alert-error').hide();
		$('input#share-signup-submit').attr('value','Signing Up...');
		$('input#share-signup-submit').attr('disabled',true);
		Glob.account_id = $('input#account-id').attr('value');
		$.ajax({
			type: 'POST',
			url: '/account/' + Glob.account_id + '/profiles',
			dataType: 'json',
			data: $('form#share-signup-form').serializeObject(),
			success: function(data) {
				$.ajax({type: 'delete', url: '/'}); // log out any previous sessions
				$.cookie('coral.session_token', data.session_token);
				Glob.profile_id = data.id;
				Glob.sub_id = data._subscriptions[0].id;
				$('#share-signup-form').fadeOut(function() {
					$('#new-pm-form').fadeIn();
					$('input#share-signup-submit').attr('value','Sign Up'); // XXX redundant
					$('input#share-signup-submit').attr('disabled',false);
				});
			},
			error: function(d) {
				$('.alert-error').html(d.responseText).show();
				$('input#share-signup-submit').attr('value','Sign Up'); // XXX redundant
				$('input#share-signup-submit').attr('disabled',false);
			}
		});
	});

	$('#new-pm-submit').click(function(e) {
		e.preventDefault();
		// Creation of payment method for this subscription
		$('.alert-error').hide();	
		$('#new-pm-submit').attr('disabled',true);
		$('#new-pm-submit').val('Saving...');
		$.ajax({
			type: 'post',
			url: '/account/' + Glob.account_id + '/profiles/' + Glob.profile_id + '/subscriptions/' + Glob.sub_id + '/payment_methods',
			dataType: 'json',
			data: $('#new-pm-form').serializeObject(),
			success: function(d) {
				window.relocate('/'); // Will bring them to their dashboard
			},
			error: function(d) {
				$('#new-pm-submit');
				$('.alert-error').html(d.responseText).show();
				$('#new-pm-submit').attr('disabled',false);
				$('#new-pm-submit').val('Save');
			}
		});
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
