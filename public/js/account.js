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
		'click #settings-submit': 'save',
		'click #settings-button': 'renderForm',
	},
	initialize: function() {
		this.model.bind('change', this.render, this);
	},

	renderForm: function() {
		this.$('#settings-name').val(this.model.get('name'));
		this.$('#settings-email').val(this.model.get('email'));
		return this;
	},

	save: function () {
		if(this.req == false) {
			var self = this;
			$('input#settings-submit').toggleSubmit();
			this.req = true; // begin PUT request
			this.model.save($('form#settings-form').serializeObject(), {
				success: function(model, response) {
					$('#account-name').html(model.get('name'));
					$('input#settings-submit').toggleSubmit();
					$('div#settings').modal('hide');
					self.req = false;
				},
				error: function(model, response) {
					$('p#settings-error').html(response.responseText);
					$('input#settings-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},
});
