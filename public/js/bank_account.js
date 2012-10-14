
// bank account updating form
Account.View.Bank = Backbone.View.extend({
	events: {
		'click .edit-bank-acct-btn': 'showForm',
		'click #cancel-bank-acct-btn': 'hideForm',

		'click #bank-account-submit': 'validate',

		'click #remove-bank-account-btn': 'confirmDelete',
		'click #remove-bank-account-submit': 'destroy',
	},

	confirmDelete: function(e) {
		e.preventDefault();
		$('#remove-ba-modal').modal('show');
	},

	destroy: function(e) { 
		var self = this;
		$('#remove-bank-account-submit').attr('disabled',true);
		$.ajax({
			type: 'delete',
			url: '/bank_account',
			data_type: 'json',
			success: function(d) {
				$('#remove-ba-modal').modal('hide');
				var body = _.template($('#edit-account-form-tmpl').html());
				self.model.set('_bank_account',{});
				$('div#edit-account').html(body(self.model.toJSON()));
			},
			error: function(d) {
				$('#account-form .alert').show();
				$('#account-form .alert').show(d.responseText);
				$('#remove-ba-modal').modal('hide');
			}
		});
	},

	validate: function(e) {
		e.preventDefault();
		$('#bank-account-submit').attr('disabled',true);
		$('#bank-account-submit').siblings().attr('disabled',true);
		$('#ajax-loader').show();
		var ba = $('#bank-account-form').serializeObject(); // will have {account_number: x, bank_code: x}
		var err = balanced.bankAccount.validate(ba);
		if(_.isEmpty(err)) {
			// no javascript validation error. now let's post to balanced
			balanced.bankAccount.create(ba, this.balancedCallback.call(this));
		} else {
			$('#edit-account .alert').hide(); // hide previous alerts
			$('#edit-account .alert-error').show();
			$('#edit-account .alert-error').html('Invalid routing number'); // that's the only error balanced.BankAccount.validate appears to return
			$('#bank-account-submit').attr('disabled',false); // re-enable submit button
			$('#ajax-loader').hide();
		}
	},

	balancedCallback: function() {
		// This function is tricky. I need to have the account model in scope so
		// that we can modify it inside the balanced callback. To do this, I pass
		// it this function with this viewmodel instantiated for 'this', and then
		// this function returns a nested function, which is the actual callback
		// for balanced. lolwut.
		var self = this;
		return function(response) {
			switch(response.status) {
				case 201:
					self.create(response.data);
					break;
				case 400:
					// missing field - details in response.error
					$('#edit-account .alert').hide();
					$('#edit-account .alert-error').show();
					$('#edit-account .alert-error').html(JSON.stringify(response));
					$('#bank-account-submit').attr('disabled',false);
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
					alert('balanced: 409 - ' + JSON.stringify(response.error));
					break;
				case 500:
					// Error on balanced's servers, try again
					alert('balanced: 500');
					break;
			}
		}
	},

	create: function(data) {
		var self = this;
		$.ajax({
			type: 'post',
			url: '/bank_account',
			dataType: 'json',
			data: data,
			success: function(d) {
				// Add bank account data to account model
				// Re-render account settings
				self.model.set('_bank_account', d);
				var body = _.template($('#edit-account-form-tmpl').html());
				$('div#edit-account').html(body(self.model.toJSON()));
				$('#ajax-loader').hide();
			},
			error: function(d) {
				$('#edit-account .alert').hide();
				$('#edit-account .alert-error').show();
				$('#edit-account .alert-error').html(d.responseText);
				$('#bank-account-submit').attr('disabled',false);
				$('#bank-account-submit').siblings().attr('disabled',false);
				$('#ajax-loader').hide();
			}
		});
	},

	hideForm: function(e) {
		e.preventDefault();
		$('#bank-acct-info').show();
		$('.bank-acct-edit').hide();
		return this;
	},

	showForm: function(e) {
		e.preventDefault();
		$('#bank-acct-info').hide();
		$('.bank-acct-edit').show();
		return this;
	},

});
