
PMView = Backbone.View.extend({
	req: false,

	initialize: function(options) {
		this.parentView = options.parentView; // this way the ProfileView's actions are accessible
	},

	events: {
		'click #new-pm-btn': 'renderNewForm',
		'click #new-pm-submit': 'create',
		'click #cancel-new-pm': 'renderNewForm',
		'change .new-payment-method-type': 'getType',
	},

	selectedSubID: null, // we'll use this for assigning payment methods to subscriptions
	renderNewForm: function(e) {
		e.preventDefault();
		this.selectedSubID = $(e.currentTarget).parents('tr').data('id');
		$('#new-pm-modal').modal('show');
	},

	getType: function(e) {
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
	},

	create: function(e) {
		if(e) e.preventDefault();
		var self = this;
		$('#new-pm-submit').attr('disabled',true);
		$('#ajax-loader').show();
		var profile = this.collection.selected;
		var data = $('#new-pm-form').serializeObject();
		$('#new-pm-form .alert').hide(); // hide any previous errors or messages

		// error checking. We'll do it manually so the messages can be more easily pretty.
		if(!balanced.card.isCardNumberValid(data.card_number)) {
			$('#new-pm-form .alert-error').show().html('Invalid credit card number.');
			$('#new-pm-submit').attr('disabled',false); // XXX this bit is redundant 
			$('#ajax-loader').hide();
		} else if (!balanced.card.isSecurityCodeValid(data.card_number, data.security_code)) {
			$('#new-pm-form .alert-error').show().html('Invalid security code.');
			$('#new-pm-submit').attr('disabled',false);
			$('#ajax-loader').hide();
		} else if (!balanced.card.isExpiryValid(data.expiration_month, data.expiration_year)) {
			$('#new-pm-form .alert-error').show().html('Invalid expiration date.');
			$('#new-pm-submit').attr('disabled',false);
			$('#ajax-loader').hide();
		} else { // no client validation errors, post to balanced
			balanced.card.create(data, this.balancedCallback.call(this));
		}
	},

	balancedCallback: function() {
		var self = this; // put self/this in the scope of our callback so we can modify its data
		var profile = self.collection.selected;
		var subID = self.selectedSubID;
		return function(response) {
			switch(response.status) {
				case 201:
					// balanced creation is successful, let's put a copy in coral's db
					$.ajax({
						type: 'post',
						url: '/profiles/' + profile.id + '/subscriptions/' + subID + '/payment_methods',
						dataType: 'json',
						data: response.data,
						success: function(d) {
							profile.set(d);
							$('#ajax-loader').hide();
							$('#new-pm-modal').modal('hide');
							self.parentView.renderProfileView();
						},
						error: function(d) {
							$('#new-pm-form .alert').hide();
							$('#new-pm-form .alert-error').show().html(d.responseText);
							$('#new-pm-submit').attr('disabled',false);
							$('#ajax-loader').hide();
						}
					});
					break;
				case 400:
					// missing field - details in response.error
					$('#new-pm-form .alert').hide();
					$('#new-pm-form .alert-error').show().html(response.error.description);
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
					$('#new-pm-form .alert').hide();
					$('#new-pm-form .alert-error').show().html(response.error.description);
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

});
