// Customers/payees/subscribers/members/clients/etc

Profile = Backbone.Model.extend({
	urlRoot: '/profiles',
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
		'click #remove-profile-button': 'renderRemoveForm',
		'click #remove-profile-submit': 'destroy',
		'click .dropdown-item': 'renderTable',
		'click #share-plan-submit': 'sharePlan',
	},

	sharePlan: function(e) {
		e.preventDefault();
		if(this.req == false) {
			this.req = true; // block other requests
			var planID = $('span.active-plan-id').attr('id'); // fetch selected plan id
			var emails = $('textarea#plan-share-emails').val(); // fetch string of emails
			var self = this; // save this object for scope
			$('input#share-plan-submit').val('Sharing...');  // toggle share button
			$('input#share-plan-submit').addClass('disabled');
			$.ajax({ // this is a custom, non-"restful" route, so we need to manually ajax
				type: 'post',
				url: '/share/' + planID, // may resolve to either the plan controller share or account controller share if planID is ''
				dataType: 'json',
				data: {emails: emails},
				success: function(data) {
					$('div#share-plan').modal('hide'); // close sharing dialog
					$('input#share-plan-submit').val('Share'); // reset submit button
					$('input#share-plan-submit').removeClass('disabled');
					_.each(data, function(d) { self.collection.add(new Profile(d)); });
					self.renderTable(); // re-render table
					self.req = false;
				},
				error: function(data) {
					$('div#share-plan').modal('hide'); // close sharing dialog
					self.req = false;
				}
			});
		}
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
					$('div#edit-profile').modal('hide');
					$('input#edit-profile-submit').toggleSubmit();
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

	destroy: function() {
		if(this.req == false) { // check request lock
			var self = this; // preserve scope
			$('a#remove-profile-submit').addClass('disabled'); // disable button
			this.req = true; // set request lock
			var profile = this.collection.get($('input#edit-profile-id').val());
			profile.destroy({
				success: function(model, response) {
					this.$('#remove-profile').modal('hide');
					$('a#remove-profile-submit').removeClass('disabled'); // disable button
					self.collection.remove(profile);
					self.req = false;
					self.renderTable();
				},
				error: function(model, response) {
					$('a#remove-profile-submit').removeClass('disabled'); // enable button
					$('p#remove-profile-error').html(response.responseText); // print error
					self.req = false; // release request lock
				}
			});
		}
	},

	renderTable: function() {
		var activePlanID = $('span.active-plan-id').attr('id');
		if(activePlanID == '') { // No plan selected, show all plans
			var filtered_profiles = this.collection.toJSON();
		} else { // a plan has been selected. Filter out subscribers
			var filtered_profiles = this.collection.filter(function(p) {
				return p.get('plan_id') == activePlanID;
			});
			filtered_profiles = (new ProfileCollection(filtered_profiles)).toJSON()
		}
		var table = _.template($('#profile-table-tmpl').html());
		$('#profile-table').slideUp();
		$('#profile-table').html(table({profiles: filtered_profiles}));
		$('#profile-table').slideDown('slow');
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
		if(activePlanName != 'Everyone')
			$('#new-profile-plan-name').html('Subscribing to: ' + activePlanName);
	},

	renderEditForm: function(e) {
		e.preventDefault();
		this.$('p#edit-profile-error').html(''); // clear errors
		var selectedProfile = this.collection.get($(e.currentTarget).attr('id'));

		// Compile and render form template
		var form = _.template($('#edit-profile-tmpl').html());
		$('div#edit-profile div.modal-body').html(form(selectedProfile.attributes));

		this.$('div#edit-profile').modal('show'); // display new profile dialog
	},

	renderRemoveForm: function(e) {
		e.preventDefault();
		$('div#edit-profile').modal('hide');
		$('p#remove-profile-error').html('');
		$('div#remove-profile').modal('show');
	},

});
