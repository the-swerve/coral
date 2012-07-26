// Charges/payments/transactions

Charge = Backbone.Model.extend({
	urlRoot: '/charges',
	idAttribute: 'short_id',
	initialize: function() {
		this.set({plan_ids: new Array()});
	}
});

ChargeCollection = Backbone.Collection.extend({
	model: Charge,
	url: '/charges',
	initialize: function() { }
});

ChargeView = Backbone.View.extend({
	id: 'charge',
	req: false,

	initialize: function() {
		this.collection.bind('reset', this.renderTable, this);
	},

	events: {
			'click #new-profile-submit': 'renderTable',
//		'click #new-charge-button': 'renderNewForm',
//		'click #new-charge-submit': 'create',
//		'click .edit-charge-button': 'renderEditForm',
//		'click #edit-charge-submit': 'update',
//		'click #new-plan-submit': 'renderTable',
//		'click .dropdown-item': 'renderTable',
	},

//	create: function(e) {
//		e.preventDefault();
//		if(this.req == false) {
//			var self = this;
//			$('input#new-charge-submit').toggleSubmit();
//			this.req = true;
//			var data = $('form#new-charge-form').serializeObject();
//			var charge = new charge();
//			charge.save(data, {
//				success: function(model, response) {
//					$('input#new-charge-submit').toggleSubmit();
//					$('div#new-charge').modal('hide');
//					self.collection.add(model);
//					self.req = false;
//					self.renderTable();
//				},
//				error: function(model, response) {
//					$('p#new-charge-error').html(response.responseText);
//					$('input#new-charge-submit').toggleSubmit();
//					self.req = false;
//				}
//			});
//		}
//	},

//	update: function(e) {
//		e.preventDefault();
//		if(this.req == false) {
//			var self = this;
//			$('input#edit-charge-submit').toggleSubmit();
//			this.req = true;
//			var data = $('form#edit-charge-form').serializeObject();
//			var charge = this.collection.get($('input#edit-charge-id').val());
//			charge.save(data, {
//				success: function(model, response) {
//					$('input#edit-charge-submit').toggleSubmit();
//					$('div#edit-charge').modal('hide');
//					self.req = false;
//					self.renderTable();
//				},
//				error: function(model, response) {
//					$('p#edit-charge-error').html(response.responseText);
//					$('input#edit-charge-submit').toggleSubmit();
//					self.req = false;
//				}
//			});
//		}
//	},

	renderTable: function() {
		// Just show all charges
		var table = _.template($('#charge-table-tmpl').html());
		$('#charge-table').html(table({charges: this.collection}));
	},

//	renderNewForm: function(e) {
//		e.preventDefault();
//		$('p#charge-error').html(''); // clear errors
//		$('form#new-charge-form input').val(''); // clear form
//		$('div#new-charge').modal('show'); // display new charge dialog
//		// In the plan dropdown, fetch the active plan id and put it into the form
//		// This way we can simulatenously create new subscriptions by sending
//		// plan_short_id to the server.
//		$('#new-charge-plan-id').val($('span.active-plan-id').attr('id'));
//		// Tell the user what plan they are subscribing to above the form.
//		var activePlanName = $('#dropdown-active').html();
//		if(activePlanName != 'All plans')
//			$('#new-charge-plan-name').html('Subscribing to: ' + activePlanName);
//	},

//	renderEditForm: function(e) {
//		e.preventDefault();
//		this.$('p#edit-charge-error').html(''); // clear errors
//		this.$('form#edit-charge-form input').val(''); // clear form
//		var selectedcharge = this.collection.get($(e.currentTarget).attr('id'));
//		this.$('input#edit-charge-id').val(selectedcharge.id); // get the charge id and insert it into a field
//		// populate form fields. XXX use a template
//		this.$('input#edit-charge-name').val(selectedcharge.get('name'));
//		this.$('input#edit-charge-email').val(selectedcharge.get('email'));
//		this.$('div#edit-charge').modal('show'); // display new charge dialog
//	}

});
