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

	id: 'plan',
	req: false,

	initialize: function() {
		this.collection.bind('reset', this.render, this);
		this.selected = 'all';
	},

	events: {
		'click #new-plan-submit': 'create',
		'click #edit-plan-submit': 'update',
		'click .dropdown-item': 'selectPlan',
		'click #new-plan-button': 'renderNewForm',
		'click #edit-plan-button': 'renderEditForm',
		'click .share-plan-button': 'renderShareForm',
		'click #remove-plan-button': 'renderRemoveForm',
		'click #remove-plan-submit': 'destroy',
	},

	renderRemoveForm: function(e) {
		e.preventDefault();
		$('div#edit-plan').modal('hide');
		$('p#remove-plan-error').html('');
		$('div#remove-plan').modal('show');
	},

	renderNewForm: function(e) {
		e.preventDefault();
		$('form#new-plan-form input').val(''); // clear inputs
		$('p#new-plan-error').html(''); // clear errors
		$('div#new-plan').modal('show'); // display dialog
	},

	// XXX I could probably split this view out into dropdown, desc, table, etc
	render: function() {
		var self = this;

		if(self.selected == 'all') {
			var active = 'All plans'; // user selected all plans (default)
			var active_id = ''; // no plan id
		} else { // user selected a plan
			var active = self.selected.get('name'); // get selected plan name
			var active_id = self.selected.id; // get selected plan id
		}
		this.$('#dropdown-active').html(active); // write out active plan name to the top of the dropdown
		this.$('span.active-plan-id').attr('id',active_id); // write out active plan id into the page

		var list = _.template(this.$('#plan-header-tmpl').html()); // compile template for plan name/dropdown
		var notSelected = self.collection.filter(function(plan) { // filter out the selected plan for the dropdown items
			return plan.get('name') != active;
		});
		this.$('.dropdown-menu').html(list({plans: notSelected})); // render dropdown template

		var desc = _.template(this.$('#plan-desc-tmpl').html()); // compile template for the plan description
		this.$('.plan-desc').html(desc({plan: self.selected})); // render tmpl

		return this; // for chaining methods on this view
	},
	
	create: function(e) {
		e.preventDefault();
		if(this.req == false) {
			var self = this;
			$('input#new-plan-submit').toggleSubmit();
			this.req = true;
			var data = $('form#new-plan-form').serializeObject();
			var plan = new Plan();
			plan.save(data, {
				success: function(model, response) {
					$('input#new-plan-submit').toggleSubmit(); // return the save button to normal
					$('div#new-plan').modal('hide'); // hide the new plan dialog

					// render blank tables for profiles and charges
					var table = _.template($('#profile-table-tmpl').html());
					$('#profile-table').html(table({profiles: {}}));
					var table = _.template($('#charge-table-tmpl').html());
					$('#charge-table').html(table({charges: {}}));

					self.collection.add(model); // add newly created model to collection
					self.selected = model; // make the selected field point to the new model
					self.req = false; // release the request lock
					self.render(); // render the plan dropdown and description
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
		if(this.req == false) { // check request lock
			var self = this; // preserve scope
			$('a#remove-plan-submit').addClass('disabled'); // disable button
			this.req = true; // set request lock
			var plan = this.collection.get(this.selected.id); // get selected plan
			plan.destroy({
				success: function(model, response) {
					window.location = '/'; // refresh page.
					// Note: this could be dynamic, without a page reload. We'd have to:
					// 1. Update all the profiles who subscribe to this plan.
					// 2. Re-render this (this.render())
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
	update: function() {
		if(this.req == false) {
			var self = this;
			$('input#edit-plan-submit').toggleSubmit();
			this.req = true;
			var plan = this.collection.get(this.selected.id);
			var data = $('form#edit-plan-form').serializeObject();
			plan.save(data, {
				success: function(model, response) {
					$('input#edit-plan-submit').toggleSubmit();
					$('div#edit-plan').modal('hide');
					self.req = false;
					self.render();
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
		e.preventDefault();
		$('p#edit-plan-error').html(''); // Make sure form errors are blank
		$('div#edit-plan').modal('show');
		// populate edit form - XXX use template
		this.$('.plan-name').val(this.selected.get('name'));
		this.$('.plan-amount').val(Number(this.selected.get('amount')).toFixed(2));
		this.$('.plan-initial-charge').val(Number(this.selected.get('initial_charge')).toFixed(2));
		this.$('.plan-cycle').val(this.selected.get('cycle'));
	},

	renderShareForm: function(e) {
		e.preventDefault();
		$('div#share-plan').modal('show');
		// populate share form - XXX maybe use template
		var url = 'http://' + document.location.hostname
		if(url == 'http://localhost') {
			url += ':' + document.location.port
		}
		this.selected != 'all'? url += this.selected.get('url') : url += '/share';
		this.$('.plan-url').html(url);
		this.$('.plan-url').attr('href',url);
	},

	selectPlan: function(e) {
		e.preventDefault();
		if($(e.currentTarget).attr('id') == 'all-plans-select') {
			this.selected = 'all';
		} else {
			this.selected = this.collection.get($(e.currentTarget).attr('id'));
		} this.render();
	}	

});
