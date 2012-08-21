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
			$('div#edit-account').slideUp();
			this.settingsShown = false;
		} else {
			$('#edit-account-button').css('fontWeight','bold');
			var body = _.template($('#edit-account-form-tmpl').html());
			$('div#edit-account').html(body(this.model.toJSON()));
			$('div#edit-account').slideDown();
			this.settingsShown = true;
		}
		return this;
	},

	save: function (e) {
		e.preventDefault();
		if(this.req == false) {
			var self = this;
			$('input#edit-account-submit').hide();
			$('#edit-account-loader').show();
			this.req = true; // begin PUT request
			this.model.save($('form#edit-account-form').serializeObject(), {
				success: function(model, response) {
					$('#account-name').html(model.get('name'));
					self.renderForm();
					$('input#edit-account-submit').show();
					$('#edit-account-loader').hide();
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

// bank account updating form
BAView = Backbone.View.extend({
	req: false,
	events: {
		'click #new-bank-account-button': 'renderForm',
		'click div#new-bank-account .back-btn': 'goBack'
	},

	renderForm: function(e) {
		if(e) e.preventDefault();
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
