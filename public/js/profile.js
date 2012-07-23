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

	renderTable: function() {
		var plan_id = $('span.active-plan-id').attr('id');
		if(plan_id == '') {
			var filtered_profiles = this.collection;
		} else {
			var filtered_profiles = this.collection;
			// TODO
			//var filtered_profiles = this.collection.filter(function(p) {
			//	return _.include(p.get('plan_ids'),plan_id);
			//});
			//filtered_profiles = new ProfileCollection(filtered_profiles);
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
	}

});
