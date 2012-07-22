// The Subscription Plan 

Plan = Backbone.Model.extend({
	url: '/plans',
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
	},

	events: {
		'click #new-plan-submit': 'save',
	},

	render: function() {
		var self = this;
		var list = _.template(this.$('#plan-header-tmpl').html());
		this.$('.dropdown-menu').html(list({plans: self.collection}));
		return this;
	},
	
	save: function() {
		if(this.req == false) {
			var self = this;
			$('input#new-plan-submit').toggleSubmit();
			this.req = true;
			var plan = new Plan();
			plan.save($('form#new-plan-form').serializeObject(), {
				success: function(model, response) {
					$('#dropdown-active').html(model.get('name'));
					$('input#new-plan-submit').toggleSubmit();
					$('form#new-plan-form input').val(''); // clear inputs
					$('div#new-plan').modal('hide');
					self.collection.add(model);
					self.selected = model;
					self.req = false;
				},
				error: function(model, response) {
					$('p#new-plan-error').html(response.responseText);
					$('input#new-plan-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	li_tmpl: _.template("<li><a class=\"dropdown-ite=\"><%= plan.get('name') %></a></li>")
		
});
