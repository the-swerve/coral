// Top level merchant accounts

Account = Backbone.Model.extend({
	url: '/account',
	idAttribute: 'short_id',
	initialize: function() { }
});


AccountView = Backbone.View.extend({
	id: 'account',
	req: false, // Keep track of whether we're currently making a server request.
	events: {
		'click #edit-account-submit': 'save',
		'click #edit-account-button': 'renderForm',
	},
	initialize: function() {
		this.model.bind('change', this.render, this);
	},

	renderForm: function(e) {
		e.preventDefault();
		var body = _.template($('#edit-account-form-tmpl').html());
		$('div#edit-account div.modal-body').html(body(this.model.toJSON()));
		$('div#edit-account').modal('show');
		return this;
	},

	save: function (e) {
		e.preventDefault();
		if(this.req == false) {
			var self = this;
			$('input#edit-account-submit').toggleSubmit();
			this.req = true; // begin PUT request
			this.model.save($('form#edit-account-form').serializeObject(), {
				success: function(model, response) {
					$('#account-name').html(model.get('name'));
					$('input#edit-account-submit').toggleSubmit();
					$('div#edit-account').modal('hide');
					self.req = false;
				},
				error: function(model, response) {
					$('p#edit-account-error').html(response.responseText);
					$('input#edit-account-submit span').html('Save');
					$('input#edit-account-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
		return this;
	},
});
			$('input#edit-account-submit span').html('Saving...');
			$('input#edit-account-submit').addClass('disabled');
					$('input#edit-account-submit span').html('Save');
					$('input#edit-account-submit').removeClass('disabled');

// bank account updating form
BAView = Backbone.View.extend({
	req: false,
	events: {
		'click #new-bank-account-button': 'renderForm',
		'click div#new-bank-account .back-btn': 'goBack'
	},

	renderForm: function(e) {
		e.preventDefault();
		$('div#edit-account').modal('hide');
		$('div#new-bank-account').modal('show');
		return this;
	},

	goBack: function(e) {
		e.preventDefault();
		$('div#new-bank-account').modal('hide');
		$('div#edit-account').modal('show');
		return this;
	},
});
