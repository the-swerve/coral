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

	$('.new-plan-button').click(function(e) {
		$(this).hide();
		$('#new-plan-form input').val(''); // clear form inputs
		$('#new-plan-form').show();
	});

	$('#cancel-new-plan').click(function(e) {
		$('#new-plan-form').hide();
		$('.new-plan-button').show();
	});

	$('#unsubscribe-btn').click(function(e) {
		$('#confirm-unsubscribe').modal('show');
	});

	$('.change-pm-btn').click(function(e) {
		$('#new-payment-method').modal('show');
	});
	
	$('.new-payment-method-type').change(function(e) {
		var sel = $('.new-payment-method-type option:selected').text();
		if(sel == 'Credit Card') {
			$('.echeck-selected').hide();
			$('.credit-card-selected').show();
		} else if(sel == 'E-check') {
			$('.credit-card-selected').hide();
			$('.echeck-selected').show();
		} else if(sel == '') {
			$('.credit-card-selected').hide();
			$('.echeck-selected').hide();
		}
	});

	$('#table-toggler').toggle(function(e) {
		$('#table-title').html('Payments');
		$(this).html('Subscriptions');
		$('#subscription-table').hide();
		$('#payments-table').slideDown();
	}, function(e) {
		$('#table-title').html('Subscriptions');
		$(this).html('Payments');
		$('#payments-table').hide();
		$('#subscription-table').slideDown();
	});


});
