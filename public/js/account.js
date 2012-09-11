// Top level merchant accounts

Account = Backbone.Model.extend({
	url: '/account',
	initialize: function() { }
});


AccountView = Backbone.View.extend({
	id: 'account',
	req: false, // Keep track of whether we're currently making a server request.
	settingsShown: false, // for toggling account settings box
	events: {
		'blur  .account-input': 'save',
		'click #edit-account-submit': 'save',
		'click #edit-account-button': 'renderForm',
		'click #close-account-settings': 'renderForm',
	},
	initialize: function() {
		this.model.bind('change', this.render, this);
	},

	renderForm: function(e) {
		if(e) e.preventDefault();
		if(this.settingsShown) {
			$('#edit-account-button').css('fontWeight','normal');
			$('div#edit-account').hide();
			this.settingsShown = false;
		} else {
			$('#edit-account-button').css('fontWeight','bold');
			var body = _.template($('#edit-account-form-tmpl').html());
			$('div#edit-account').html(body(this.model.toJSON()));
			$('div#edit-account').show();
			this.settingsShown = true;
		}
		return this;
	},

	save: function (e) {
		e.preventDefault();
		$('#edit-account-error').hide();
		var self = this;
		$('#ajax-loader').show();
		this.model.save($('form#edit-account-form').serializeObject(), {
			success: function(model, response) {
				$('#account-name').html(model.get('name'));
				$('#ajax-loader').hide();
			},
			error: function(model, response) {
				$('#edit-account-error').show();
				$('#edit-account-error').html(response.responseText);
			}
		});
		return this;
	},
});

// bank account updating form
BAView = Backbone.View.extend({
	req: false,
	events: {
		'click #new-bank-account-btn': 'showForm',
		'click div#new-bank-account .back-btn': 'goBack',
		'click #new-bank-account-submit': 'validate',
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
				$('#new-bank-account-form .alert').show();
				$('#new-bank-account-form .alert').show(d.responseText);
				$('#remove-ba-modal').modal('hide');
			}
		});
	},

	validate: function(e) {
		e.preventDefault();
		var ba = $('#new-bank-account-form').serializeObject(); // will have {name: account_number: x, routing_number: x}
		var err = balanced.bankAccount.validate(ba);
		var alrt = $('#new-bank-account-form .alert');
		$('#new-bank-account-submit').hide();
		$('#ajax-loader').show();
		if(_.isEmpty(err)) {
			// no javascript validation error. now let's post to balanced
			balanced.bankAccount.create(ba, this.balancedCallback.call(this));
			// If we use balanced.js as above, I'm not sure how we can add the bank account data inside the callback to our account model in backbone
			// this.balancedCreate(ba);
		} else {
			alrt.html('Invalid routing number'); // that's the only error balanced.BankAccount.validate appears to return
			alrt.show();
			$('#new-bank-account-submit').show();
			$('#ajax-loader').hide();
		}
	},

	balancedCallback: function() {
		var self = this;
		return function(response) {
			switch(response.status) {
				case 201:
					self.create(response.data);
					break;
				case 400:
					// missing field - details in response.error
					var alrt = $('#new-bank-account-form .alert');
					alrt.show();
					if(~(response.error.description).indexOf('account_number')) {
						alrt.html('Invalid account number');
					} else if(~(response.error.description).indexOf('name')) {
						alrt.html('Invalid name');
					}
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

	// pass in the bank account data
	balancedCreate: function(data) {
		var self = this;
		$.ajax({
			type: 'post',
			url: 'https://api.balancedpayments.com/v1/marketplaces/' + balancedUri + '/bank_accounts',
			dataType: 'jsonp',
			data: data,
			username: balancedUsername,
			success: function(d) {
				// if the post was successful to balanced, then let's create a copy in our own database
				alrt.hide(); // hide any errors
				$('#ajax-loader').hide();
				// post to our own server to create a BankAccount model, nested in an Account
				self.create(d.data);
			},
			error: function(d) {
				$('#new-bank-account-form .alert').show();
				$('#new-bank-account-form .alert').html(d.responseText);
				$('#ajax-loader').hide();
			}
		});
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
				$('#new-bank-account-form .alert').show();
				$('#new-bank-account-form .alert').html(d.responseText);
				$('#ajax-loader').hide();
			}
		});
	},

	showForm: function(e) {
		if(e) e.preventDefault();
		$('#new-bank-account-btn').hide();
		$('#new-bank-account-form').show();
		return this;
	},

	goBack: function(e) {
		e.preventDefault();
		$('div#new-bank-account').modal('hide');
		$('div#edit-account').modal('show');
		return this;
	},
});
