// The Subscription Plan 

Plan = Backbone.Model.extend({
	urlRoot: '/plans',
	initialize: function() {
	}
});

PlanCollection = Backbone.Collection.extend({
	model: Plan,
	url: '/plans',
	initialize: function() { }
});

PlanView = Backbone.View.extend({

	req: false,

	initialize: function() {
		this.collection.bind('reset', this.renderInitial, this);
	},

	events: {
		'click #new-plan-submit': 'create',
		'click #edit-plan-submit': 'update',
		'click #cancel-edit-plan': 'renderNav',
		'click #remove-plan-submit': 'destroy',

		'click .dropdown-item': 'selectPlan',

		'click #new-plan-button': 'renderNewForm',
		'click #edit-plan-button': 'renderEditForm',
		'click .share-plan-button': 'renderShareForm',
		'click #remove-plan-button': 'renderRemoveForm',
		'click #new-subscription-button': 'renderNewSubscriptionForm',
	},

	renderInitial: function() {
		this.collection.selected = this.collection.first();
		this.renderNav();
	},

	renderNav: function(e) {
		/* This will run on page load, instantiating the selected plan and rendering the initial templates.
		 */
		if(e) e.preventDefault();
		if(this.collection.isEmpty()) { // show the new plan dialog after new account creation
			this.renderNewForm();
		} else {
			var self = this;
			var list = _.template(this.$('#plan-nav-tmpl').html());
			this.$('#plan-nav-container').html(list({plans: this.collection, selected: this.collection.selected}));
			var desc = _.template(this.$('#plan-desc-tmpl').html());
			this.$('#plan-desc-container').html(desc({plan: this.collection.selected}));

			// jquery fluff (dependent on template being rendered)
			$('.dropdown-toggle, .plan-actions').tooltip();

			return this;
		}
	},

	renderRemoveForm: function(e) {
		if(e) e.preventDefault();
		$('p#remove-plan-error').html(''); // clear errors
		$('div#remove-plan').modal('show');
	},

	renderNewForm: function(e) {
		if(e) e.preventDefault();

		$(e.currentTarget).parent().addClass('active');
		$(e.currentTarget).parent().siblings().removeClass('active');
		this.collection.selected = null;
		// render blank tables for profiles and charges
		$('#profiles-table').html('');

		$('p#new-plan-error').html(''); // clear errors
		var tmpl = _.template($('#plan-new-tmpl').html());
		$('#plan-desc-container').html(tmpl());
	},
	
	create: function(e) {
		if(e) e.preventDefault();
		if(this.req == false) {
			var self = this;
			$('input#new-plan-submit').hide();
			$('input#new-plan-submit').siblings().hide();
			$('#new-plan-loader').show();
			this.req = true;
			var data = $('form#new-plan-form').serializeObject();
			var plan = new Plan();
			plan.save(data, {
				success: function(model, response) {
					$('div#new-plan').modal('hide'); // hide the new plan dialog

					// render blank tables for profiles and charges
					var table = _.template($('#profile-table-tmpl').html());
					$('#profile-table').html(table({profiles: {}}));

					self.collection.add(model);
					self.collection.selected = model;
					self.req = false; // release the request lock
					self.renderNav();
				},
				error: function(model, response) {
					$('p#new-plan-error').html(response.responseText);
					$('input#new-plan-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	destroy: function() {
		alert('hi');
		if(this.req == false) { // check request lock
			var self = this; // preserve scope
			$('a#remove-plan-submit').addClass('disabled'); // disable button
			this.req = true; // set request lock
			this.collection.selected.destroy({
				success: function(model, response) {
					window.location = '/'; // refresh page.
					// Note: this could be dynamic, without a page reload. We'd have to:
					// 1. Update all the profiles who subscribe to this plan.
					// 2. Re-render nav (this.renderNav())
					// 3. Re-render the profile table
					// Also we'd need to remove request lock for this view, close modal, and enable button.
				},
				error: function(model, response) {
					$('a#remove-plan-submit').removeClass('disabled'); // enable button
					$('p#remove-plan-error').html(response.responseText); // print error
					self.req = false; // release request lock
				}
			});
		}
	},

	// XXX create and update are pretty redundant as separate funcs
	update: function(e) {
		if(e) e.preventDefault();
		if(this.req == false) {
			var self = this;
			$('input#edit-plan-submit').hide();
			$('input#edit-plan-submit').siblings().hide();
			$('#edit-plan-loader').show();
			this.req = true;
			var data = $('form#edit-plan-form').serializeObject();
			this.collection.selected.save(data, {
				success: function(model, response) {
					$('input#edit-plan-submit').toggleSubmit();
					$('div#edit-plan').modal('hide');
					self.req = false;
					self.renderNav();
				},
				error: function(model, response) {
					$('p#edit-plan-error').html(response.responseText);
					$('input#edit-plan-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	renderEditForm: function(e) {
		if(e) e.preventDefault();
		$('p#edit-plan-error').html(''); // Make sure form errors are blank
		var tmpl = _.template($('#plan-edit-tmpl').html());
		$('#plan-desc-container').html(tmpl({plan: this.collection.selected}));
	},

	renderShareForm: function(e) {
		if(e) e.preventDefault();
		$('div#share-plan').modal('show');
	},

	selectPlan: function(e) {
		e.preventDefault();
		this.collection.selected = this.collection.get($(e.currentTarget).attr('data-id'));
		this.renderNav();
	},

	renderNewSubscriptionForm: function(e) {
		if(e) e.preventDefault();
		var options = '<select>';
		$('div#edit-profile').modal('show');
		$('div#new-subscription').modal('show');
	},

});
