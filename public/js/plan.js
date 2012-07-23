// The Subscription Plan 

Plan = Backbone.Model.extend({
	urlRoot: '/plans',
	idAttribute: 'short_id',
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
		'click .dropdown-item': 'select_plan',
		'click #new-plan-button': 'renderNewForm',
		'click #edit-plan-button': 'renderEditForm',
		'click #share-plan-button': 'renderShareForm',
		'click #remove-plan-button': 'renderRemoveForm',
		'click #remove-plan-submit': 'destroy',
		'click #all-plans-select': 'selectAll'
	},

	selectAll: function() {
		this.selected = 'all';
		this.render();
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

		if(self.selected == 'all')
			var active = 'All plans';
		else {
			var active = self.selected.get('name');
		}

		this.$('#dropdown-active').html(active); // set active plan

		var list = _.template(this.$('#plan-header-tmpl').html());
		this.$('.dropdown-menu').html(list({plans: self.collection}));

		var desc = _.template(this.$('#plan-desc-tmpl').html());
		this.$('.plan-desc').html(desc({plan: self.selected}));

		return this;
	},
	
	create: function() {
		if(this.req == false) {
			var self = this;
			$('input#new-plan-submit').toggleSubmit();
			this.req = true;
			var data = $('form#new-plan-form').serializeObject();
			var plan = new Plan();
			plan.save(data, {
				success: function(model, response) {
					$('input#new-plan-submit').toggleSubmit();
					$('div#new-plan').modal('hide');
					self.collection.add(model);
					self.selected = model;
					self.req = false;
					self.render();
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
					$('a#remove-plan-submit').removeClass('disabled'); // enable button
					$('div#remove-plan').modal('hide'); // close dialog
					self.selected = 'all'; // view all plans
					self.req = false; // release request lock
					self.render(); // re-render plan view
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
		// populate edit form - XXX maybe use template
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
		} url += this.selected.get('url');
		this.$('.plan-url').html(url);
		this.$('.plan-url').attr('href',url);
	},

	select_plan: function(e) {
		e.preventDefault();
		this.selected = this.collection.get($(e.currentTarget).attr('id'));
		this.render();
	}	

});
