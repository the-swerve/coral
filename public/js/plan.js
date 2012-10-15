// The Subscription Plan 

Plan = {}; // namespace this biatch
Plan.View = {};

Plan.Model= Backbone.Model.extend({
	urlRoot: '/plans',
	initialize: function() {
	}
});

Plan.Collection = Backbone.Collection.extend({
	model: Plan.Model,
	url: '/plans',
	initialize: function() { }
});


Plan.View.Table = Backbone.View.extend({
	initialize: function(options) {
		_.bindAll(this, 'render');
		var self = this;
		this.plans = options.plans;
		this.profiles = options.profiles;
		// Initially show members of the first plan
		this.profiles.bind('reset', function() {
			self.plans.selected = self.plans.first();
			self.render();
		});
		this.profileDetails =  new Profile.View.Details({
			el: this.el, collection: this.profiles, plans: this.plans, tableView: this
		});
	},
	events: {
		'click .dropdown-item' : 'selectPlan',
		'click #new-plan-button': 'newPlan',
		'click #edit-plan-button': 'editPlan',
		'click #remove-plan-button': 'removePlan',

		// profile dispatching
	},
	selectPlan: function(e) {
		e.preventDefault();
		// The plan links will have the data-id attribute holding their id's
		this.plans.selected = this.plans.get($(e.currentTarget).attr('data-id'));
		this.render();
	},
	newPlan: function(e) {
		e.preventDefault();
		$(e.currentTarget).parent().addClass('active');
		$(e.currentTarget).parent().siblings().removeClass('active');
		this.plans.selected = null;
		this.planForm = new Plan.View.New({el: this.el, collection: this.plans, tableView: this});
	},
	editPlan: function(e) {
		e.preventDefault();
		this.editPlanForm = new Plan.View.Edit(
				{el:this.el, collection: this.plans, tableView: this, profiles: this.profiles});
	},
	removePlan: function(e) {
		e.preventDefault();
		// The plan links will have the data-id attribute holding their id's
		this.removePlanModal = new Plan.View.Remove(
				{el: this.el, collection: this.plans, profiles: this.profiles, tableView: this});
	},
	render: function() {
		/* This will run on page load, instantiating the selected plan and
		 * rendering the initial templates.
		 */
		if(this.plans.isEmpty()) { // show the new plan form if they don't have any
			this.renderNewForm();
		} else {
			var self = this;
			
			// 1. Render the list of plans on the left.
			var list = _.template($('#plan-nav-tmpl').html());
			this.$('#plan-nav-container').html(list({plans: this.plans, selected: this.plans.selected}));

			// 2. Compile the plan description above the table.
			var desc = _.template($('#plan-desc-tmpl').html());

			// 3. Filter out all members of the selected plan
			var filteredProfiles = this.profiles.filter(function(p) {
				return _.include(p.get('plan_ids'), self.plans.selected.id);
			});
			filteredProfiles = (new Profile.Collection(filteredProfiles)).toJSON() // wut. is this circular?

			// Compile the table of profiles
			var table = _.template($('#profile-table-tmpl').html());

			$('#profiles-table-container').hide(); // necessary?
			var descAndTable = desc({plan: self.plans.selected}) + table({profiles: filteredProfiles});
			$('#profiles-container').html(descAndTable);
			$('#profile-table-container').slideDown('slow');

		}
		return this;
	},
});

// New plan form view. Self-rendering.
Plan.View.New = Backbone.View.extend({
	initialize: function(options) {
		this.tableView = options.tableView;
		this.render();
	},
	events: {
		'click #new-plan-submit': 'create',
	},
	render: function() {
		$('p#new-plan-error').html(''); // clear errors
		var tmpl = _.template($('#plan-new-tmpl').html());
		$('#profiles-container').html(tmpl());
		return this;
	},
	create: function(e) {
		var self = this;
		$('input#new-plan-submit').attr('disabled',true);
		$('#new-plan-form .alert-error').hide();
		$('#ajax-loader').show();
		var data = $('#new-plan-form').serializeObject();
		data['amount'] = data['amount'] * 100; // coral only accepts cents, not dollars
		data['initial_charge'] = data['initial_charge'] * 100; // coral only accepts cents, not dollars
		var plan = new Plan.Model();
		plan.save(data, {
			success: function(model, response) {

				$('#ajax-loader').hide();
				self.collection.add(model);
				self.collection.selected = model;

				// render the table view
				self.tableView.render();
			},
			error: function(model, response) {
				$('#new-plan-form .alert-error').html(response.responseText).show();
				$('#ajax-loader').hide();
				$('#new-plan-submit').attr('disabled',false);
			}
		});
		return this;
	},
});

Plan.View.Edit = Backbone.View.extend({
	initialize: function(options) {
		this.tableView = options.tableView;
		this.profiles = options.profiles;
		this.render();
	},
	events: {
		'click #cancel-edit-plan': 'unrender',
		'click #edit-plan-submit': 'update',
	},
	render: function() {
		$('p#edit-plan-error').html(''); // Make sure form errors are blank
		var tmpl = _.template($('#plan-edit-tmpl').html());
		
		$('#plan-desc').hide();
		$('#plan-edit-container').show();
		$('#plan-edit-container').html(tmpl({plan: this.collection.selected}));
		return this;
	},
	unrender: function(e) {
		e.preventDefault();
		$('#plan-edit-container').hide();
		$('#plan-desc').show();
	},
	update: function(e) {
		e.preventDefault();
		var self = this;
		$('#edit-plan-submit').attr('disabled',true);
		$('#edit-plan-submit').siblings().attr('disabled',true);
		$('#ajax-loader').show();
		var data = $('#edit-plan-form').serializeObject();
		data['amount'] = data['amount'] * 100; // coral only accepts cents, not dollars
		data['initial_charge'] = data['initial_charge'] * 100; // coral only accepts cents, not dollars
		this.collection.selected.save(data, {
			success: function(model, response) {
				$('#ajax-loader').hide();
				self.profiles.fetch();
				self.tableView.render();
			},
			error: function(model, response) {
				$('#edit-plan-submit').attr('disabled',false);
				$('#edit-plan-submit').siblings().attr('disabled',false);
				$('#ajax-loader').hide();
				$('#edit-plan-form .alert-error').html(response.responseText).show();
			}
		});
	},
});

Plan.View.Remove = Backbone.View.extend({
	initialize: function(options) {
		this.tableView = options.tableView;
		this.profiles = options.profiles;
		this.render();
	},
	events: {
		'click #remove-plan-submit': 'destroy',
	},
	render: function() {
		$('div#remove-plan .alert-error').hide(); // clear errors
		$('div#remove-plan').modal('show');
	},
	req: false, // multiple request lock
	destroy: function() {
		if(this.req == false) { // check request lock
			var self = this; // preserve scope
			$('a#remove-plan-submit').addClass('disabled'); // disable button
			this.req = true; // set request lock
			this.collection.selected.destroy({
				success: function(model, response) {
					self.collection.selected = self.collection.first();
					self.tableView.render();
					self.profiles.fetch();
					$('div#remove-plan').modal('hide');
				},
				error: function(model, response) {
					$('a#remove-plan-submit').removeClass('disabled'); // enable button
					$('p#remove-plan-error').html(response.responseText); // print error
					self.req = false; // release request lock
				}
			});
		}
	},
});

Plan.View.Share = Backbone.View.extend({
	initialize: function(options) {
	},
	events: {
		'click .share-plan-button': 'render',
	},
	render: function() {
		$('div#share-plan').modal('show');
	},
});
