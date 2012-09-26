
$(document).ready(function() {

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

// Backbone stuff

Profile = Backbone.Model.extend({
	urlRoot: '/profiles',
	initialize: function() { }
});

ProfileView = Backbone.View.extend({

	initialize: function() { },

	events: {
		'click .toggle-profile-edit-btn': 'toggleEditing',
		'change #new-pm-type': 'changePMType',
		'click #new-pm-btn': 'showNewPMForm',
		'click #new-pm-submit': 'createPM',

		'click #edit-profile-submit': 'update',
		'click .remove-pm-btn': 'removePMConfirm',
		'click #remove-pm-submit': 'destroyPM',
	},

	update: function(e) {
		e.preventDefault();
		$('.alert').hide();
		$('#edit-profile-submit').attr('disabled',true);
		$('#ajax-loader').show();
		var self = this;
		$.ajax({
			type: 'put',
			url: '/profile',
			dataType: 'json',
			data: $('#edit-profile-form').serializeObject(),
			success: function(d) {
				self.model.set(d);
				$('#name').html(d.name);
				$('#edit-profile .alert-success').html('Saved.').show();
				$('#edit-profile-submit').attr('disabled',false);
				$('#ajax-loader').hide();
			},
			error: function(d) {
				$('#edit-profile .alert-error').html(d.responseText).show();
				$('#edit-profile-submit').attr('disabled',false);
				$('#ajax-loader').hide();
			}
		});
	},


	editing: false,
	toggleEditing: function(e) {
		if(e) e.preventDefault();
		if(this.editing) {
			$('#edit-profile').slideUp();
			this.editing = false;
		} else {
			var tmp = _.template($('#edit-profile-tmpl').html());
			$('#edit-profile').html( tmp({profile: this.model}) ).slideDown();
			this.editing = true;
		}
		return this;
	},

	showNewPMForm: function(e) {
		$(e.currentTarget).hide();
		$('#new-pm-form').show();
	},

	changePMType: function(e) {
		var sel = $('#new-pm-type option:selected').text();
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
	},

	createPM: function(e) {
		if(e) e.preventDefault();
		var self = this;
		$('#new-pm-submit').attr('disabled',true);
		$('#ajax-loader').show();
		var data = $('#new-pm-form').serializeObject();
		$('.alert').hide(); // hide any previous errors or messages

		// error checking. We'll do it manually so the messages can be more easily pretty.
		if(!balanced.card.isCardNumberValid(data.card_number)) {
			$('#edit-profile .alert-error').show().html('Invalid credit card number.');
			$('#new-pm-submit').attr('disabled',false); // XXX this bit is redundant 
			$('#ajax-loader').hide();
		} else if (!balanced.card.isSecurityCodeValid(data.card_number, data.security_code)) {
			$('#edit-profile .alert-error').show().html('Invalid security code.');
			$('#new-pm-submit').attr('disabled',false);
			$('#ajax-loader').hide();
		} else if (!balanced.card.isExpiryValid(data.expiration_month, data.expiration_year)) {
			$('#edit-profile .alert-error').show().html('Invalid expiration date.');
			$('#new-pm-submit').attr('disabled',false);
			$('#ajax-loader').hide();
		} else { // no client validation errors, post to balanced
			balanced.card.create(data, this.balancedCallbackPM.call(this));
		}
	},

	balancedCallbackPM: function() {
		var self = this; // put self/this in the scope of our callback so we can modify its data
		var profile = self.model;
		return function(response) {
			switch(response.status) {
				case 201:
					// balanced creation is successful, let's put a copy in coral's db
					$.ajax({
						type: 'post',
						url: '/profile/payment_methods',
						dataType: 'json',
						data: response.data,
						success: function(d) {
							profile.set(d);
							self.toggleEditing().toggleEditing(); // re-render editing view (hide then show it)
							$('#ajax-loader').hide();
						},
						error: function(d) {
							$('#edit-profile .alert-error').html(d.responseText).show();
							$('#new-pm-submit').attr('disabled',false);
							$('#ajax-loader').hide();
						}
					});
					break;
				case 400:
					// missing field - details in response.error
					$('#edit-profile .alert-error').html(response.error.description).show();
					$('#new-pm-submit').attr('disabled',false);
					$('#ajax-loader').hide();
					break;
				case 402:
					// could not authorize buyer's credit card - details in response.error
					alert('balanced: 402');
					break;
				case 404:
					// incorrect marketplace URI
					alert('balanced: 404');
					break;
				case 409:
					// incorrect marketplace URI
					$('#edit-profile .alert-error').html(response.error.description).show();
					$('#new-pm-submit').attr('disabled',false);
					$('#ajax-loader').hide();
					break;
				case 500:
					// Error on balanced's servers, try again
					alert('balanced: 500');
					break;
			}
		}
	},

	selectedPM: null,
	removePMConfirm: function(e) {
		e.preventDefault();
		this.selectedPM = $(e.currentTarget).parent().parent().data('id');
		$('#remove-pm-confirm').modal('show');
	},

	destroyPM: function(e) {
		if(e) e.preventDefault();
		$('.alert').hide();
		$('#ajax-loader').show();
		var self = this;
		var pm_id = this.selectedPM;
		$('#remove-pm-submit').attr('disabled',true);
		$.ajax({
			type: 'delete',
			url: '/profile/payment_methods/' + pm_id,
				dataType: 'json',
				success: function(d) {
					self.model.set(d);
					$('#remove-pm-submit').attr('disabled',false);
					$('#remove-pm-confirm').modal('hide');
					$('#ajax-loader').hide();
					self.toggleEditing().toggleEditing();
				},
				error: function(d) {
					$('#remove-pm-submit').attr('disabled',false);
					$('#remove-pm-confirm').modal('hide');
					$('#ajax-loader').hide();
					$('#edit-profile .alert-error').html(d.responseText).show();
			}
		});
	},

});
