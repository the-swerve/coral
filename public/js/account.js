// Top level merchant accounts

Account = {}; // namespace all this jazz

Account.Model = Backbone.Model.extend({
	url: '/account',
	initialize: function() { }
});

// We only ever deal with one account; no collection required.

Account.View = {};
// Updates account name in h1 title
Account.View.title = Backbone.View.extend({

	initialize: function(options) {
		_.bindAll(this, 'render');
		this.model.bind('change:name', this.render);
	},

	render: function() {
		this.$el.html(this.model.get('name'));
		return this;
	},

});

// The account settings panel
Account.View.settings = Backbone.View.extend({
	initialize: function(options) {
		this.settingsShown = false;
	},
	events: {
		'click #edit-account-btn' : 'render',
		'click #close-account-settings' : 'render',
	},
	// will toggle display of settings
	render: function() {
		if(this.settingsShown) {
			$('#edit-account-btn').css('fontWeight','normal');
			$('div#edit-account').slideUp('slow');
			this.settingsShown = false;
		} else {
			$('#edit-account-btn').css('fontWeight','bold');
			var template = _.template($('#edit-account-form-tmpl').html());
			$('div#edit-account').html(template(this.model.toJSON()));
			$('div#edit-account').slideDown('slow');
			this.settingsShown = true;
		}
		return this;
	},
});

Account.View.help = Backbone.View.extend({
	initialize: function(options) {
	},
	events: {
		'click #get-help': 'render',
	},
	render: function() {
		alert('sup');
	},
});

Account.View.edit = Backbone.View.extend({
	events: {
		'click .edit-field-btn': 'revealInput',
		'click .cancel-acct-edit': 'hideInput',
		'keypress .field-controls input': 'saveField',
	},
	revealInput: function(e) {
		e.preventDefault();
		$(e.currentTarget).hide();
		$(e.currentTarget).siblings('.acct-field').hide();
		$(e.currentTarget).siblings('.field-controls').show();
	},
	hideInput: function(e) {
		e.preventDefault();
		var p = $(e.currentTarget).parent().parent();
		p.parent().hide();
		p.parent().siblings('.acct-field').show();
		p.parent().siblings('.edit-field-btn').show();
	},
	saveField: function(e) {
		if (e.which != 13) return this;
		e.preventDefault();
		// ui bits
		$(e.currentTarget).attr('disabled',true);
		$('#ajax-loader').show();
		$('.profile-alerts .alert').hide();
		// ajax bits
		var self = this;
		var name = $(e.currentTarget).attr('name');
		var val = $(e.currentTarget).val(); // new value of the field we're editing
		var data = {};
		data[name] = val; // i have to initialize the data hash this way because if i do {name : val}, javascript turns name into a string
		this.model.save(data,
			{
				success: function(m,r) {
					$(e.currentTarget).attr('disabled',false);
					$('#ajax-loader').hide();
					$(e.currentTarget).parent().siblings('.acct-field').html(val).show();
					$(e.currentTarget).parent().siblings('.edit-field-btn').show();
					$(e.currentTarget).parent().hide();
				},
				error: function(m,r) {
					$('.profile-alerts .alert-error').html(r.responseText).show();
					$(e.currentTarget).attr('disabled',false);
					$('#ajax-loader').hide();
					$(e.currentTarget).parent().siblings('.acct-field').show();
					$(e.currentTarget).parent().siblings('.edit-field-btn').show();
					$(e.currentTarget).parent().hide();
				}
			}
		); // end save()
	}, // end saveField
});
