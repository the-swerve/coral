// Top level merchant accounts

Account = {}; // namespace all this jazz

Account.Model = Backbone.Model.extend({
	url: '/account',
	initialize: function() { }
});

// We only ever deal with one account; no collection required.

Account.View = {};
// Updates account name in h1 title
Account.View.Title = Backbone.View.extend({

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
Account.View.Settings = Backbone.View.extend({
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

// TODO
Account.View.Help = Backbone.View.extend({
	initialize: function(options) {
	},
	events: {
		'click #get-help': 'render',
	},
	render: function() {
		alert('sup');
	},
});

Account.View.Edit = Backbone.View.extend({
	events: {
		'click .edit-field-btn': 'showField',
		'click .cancel-edit': 'hideField',
		'keypress .field-controls input': 'saveField',
	},
	// XXX this is redundant with Profile.View.Edit.showField
	// see profile.js for more notes on these redundant functions
	showField: function(e) {
		if(e) { // if a click event, get the selected field
			e.preventDefault();
			this.infoGroup = $(e.currentTarget).parents('.info-group');
		}
		this.infoGroup.children('.field-name').children('.edit-field-btn').hide();
		this.infoGroup.children('.profile-field').hide();
		this.infoGroup.children('.field-name').children('.save-info').show();
		this.infoGroup.children('.field-controls').show();
		return this;
	},
	hideField: function(e) {
		if(e) e.preventDefault();
		this.infoGroup.children('.field-name').children('.edit-field-btn').show();
		this.infoGroup.children('.profile-field').show();
		this.infoGroup.children('.field-name').children('.save-info').hide();
		this.infoGroup.children('.field-name').children('.save-status').hide();
		this.infoGroup.children('.field-controls').hide();
		return this;
	},
	// XXX very redundant with Profile.View.Edit.saveField()
	saveField: function(e) {
		if (e.which != 13) return this;
		// this.infoGroup will be the selected div.info-group
		var input = this.infoGroup.children('.field-controls').children('input');
		var btn = this.infoGroup.children('.field-controls')
		// ui bits
		this.infoGroup.children('.field-name').children('.save-info').hide();
		this.infoGroup.children('.field-name').children('.save-status').show();
		input.attr('disabled',true);
		$('.profile-alerts .alert').hide();
		$('#ajax-loader').show();
		// ajax bits
		var self = this;
		var name = input.attr('name');
		var val = input.val(); // new value of the field we're editing
		var data = {};
		data[name] = val; // i have to initialize the data hash this way because if i do {name : val}, javascript turns name into a string
		var previous = this.model.get(name);
		this.model.save(data,
			{
				success: function(m,r) {
					input.attr('disabled',false);
					$('#ajax-loader').hide();
					self.infoGroup.children('.profile-field').html(val);
					self.hideField();
				},
				error: function(m,r) {
					input.attr('disabled',false);
					m.set(name,previous); // roll back field
					input.val(m.get(name)); // reset input
					$('#ajax-loader').hide();
					$('.profile-alerts .alert-error').html(r.responseText + ' - ' + val).show();
					self.hideField();
				}
			}
		); // end save()
	}, // end saveField
});
