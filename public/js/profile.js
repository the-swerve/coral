// Customers/payees/subscribers/members/clients/etc

Profile = Backbone.Model.extend({
	urlRoot: '/profiles',
	idAttribute: 'short_id',
	initialize: function() {
		this.set({plan_ids: new Array()});
	}
});

ProfileCollection = Backbone.Collection.extend({
	model: Profile,
	url: '/profiles',
	initialize: function() { }
});

ProfileView = Backbone.View.extend({
	id: 'profile',
	req: false,

	initialize: function() {
		this.collection.bind('reset', this.renderTable, this);
	},

	events: {
		'click #new-profile-button': 'renderNewForm',
		'click #new-profile-submit': 'create',
		'click .edit-profile-button': 'renderEditForm',
		'click #edit-profile-submit': 'update',
		'click #new-plan-submit': 'renderTable',
		'click .dropdown-item': 'renderTable',
	},

	create: function(e) {
		e.preventDefault();
		if(this.req == false) {
			var self = this;
			$('input#new-profile-submit').toggleSubmit();
			this.req = true;
			var data = $('form#new-profile-form').serializeObject();
			var profile = new Profile();
			profile.save(data, {
				success: function(model, response) {
					$('input#new-profile-submit').toggleSubmit();
					$('div#new-profile').modal('hide');
					self.collection.add(model);
					self.req = false;
					self.renderTable();
				},
				error: function(model, response) {
					$('p#new-profile-error').html(response.responseText);
					$('input#new-profile-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	update: function(e) {
		e.preventDefault();
		if(this.req == false) {
			var self = this;
			$('input#edit-profile-submit').toggleSubmit();
			this.req = true;
			var data = $('form#edit-profile-form').serializeObject();
			var profile = this.collection.get($('input#edit-profile-id').val());
			profile.save(data, {
				success: function(model, response) {
					$('input#edit-profile-submit').toggleSubmit();
					$('div#edit-profile').modal('hide');
					self.req = false;
					self.renderTable();
				},
				error: function(model, response) {
					$('p#edit-profile-error').html(response.responseText);
					$('input#edit-profile-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	renderTable: function() {
		var activePlanID = $('span.active-plan-id').attr('id');
		if(activePlanID == '') { // No plan selected, show all plans
			var filtered_profiles = this.collection;
		} else { // a plan has been selected. Filter out subscribers
			var filtered_profiles = this.collection.filter(function(p) {
				return p.get('plan_id') == activePlanID;
			}); filtered_profiles = new PlanCollection(filtered_profiles);
		}
		var table = _.template($('#profile-table-tmpl').html());
		$('#profile-table').html(table({profiles: filtered_profiles}));
	},

	renderNewForm: function(e) {
		e.preventDefault();
		$('p#profile-error').html(''); // clear errors
		$('form#new-profile-form input').val(''); // clear form
		$('div#new-profile').modal('show'); // display new profile dialog
		// In the plan dropdown, fetch the active plan id and put it into the form
		// This way we can simulatenously create new subscriptions by sending
		// plan_short_id to the server.
		$('#new-profile-plan-id').val($('span.active-plan-id').attr('id'));
		// Tell the user what plan they are subscribing to above the form.
		var activePlanName = $('#dropdown-active').html();
		if(activePlanName != 'All plans')
			$('#new-profile-plan-name').html('Subscribing to: ' + activePlanName);
	},

	renderEditForm: function(e) {
		e.preventDefault();
		this.$('p#edit-profile-error').html(''); // clear errors
		this.$('form#edit-profile-form input').val(''); // clear form
		var selectedProfile = this.collection.get($(e.currentTarget).attr('id'));
		this.$('input#edit-profile-id').val(selectedProfile.id); // get the profile id and insert it into a field
		// populate form fields. XXX use a template
		this.$('input#edit-profile-name').val(selectedProfile.get('name'));
		this.$('input#edit-profile-email').val(selectedProfile.get('email'));
		this.$('div#edit-profile').modal('show'); // display new profile dialog
	}

});
