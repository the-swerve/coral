// Charges/payments/transactions

ChargeModel = Backbone.Model.extend({
	urlRoot: '/charges',
	initialize: function() {
		this.set({plan_ids: new Array()});
	}
});

ChargeCollection = Backbone.Collection.extend({
	model: ChargeModel,
	url: '/charges',
	initialize: function() { }
});

ChargeView = Backbone.View.extend({
	id: 'charge',
	req: false,

	initialize: function(options) {
		this.profiles = options.profiles;
		this.selected_charge = null; // selected in renderEditForm
	},

	events: {
			'click .edit-charge-button': 'renderEditForm',
			'click .new-charge-btn': 'renderNewForm',
			'click #remove-charge-button': 'renderRemoveForm',
			'click #void-charge-button': 'renderVoidForm',
			'click #new-charge-submit': 'create',
			'click #edit-charge-submit': 'update',
			'click #remove-charge-submit': 'destroy',
			'click #void-charge-submit': 'void',
	},

	renderRemoveForm: function(e) {
		e.preventDefault();
		tmpl = _.template($('#remove-charge-tmpl').html());
		$('div#edit-profile-payments').html(tmpl());
	},

	renderVoidForm: function(e) {
		e.preventDefault();
		tmpl = _.template($('#void-charge-tmpl').html());
		$('div#edit-profile-payments').html(tmpl());
	},

	void: function(e) {
		if(e) e.preventDefault();
		if(this.req == false) { // check request lock
			var self = this; // preserve scope
			$('a#void-charge-submit').addClass('disabled'); // disable button
			this.req = true; // set request lock
			$.ajax({
				type: 'post',
				url: '/profiles/' + self.profiles.selected.id + '/charges/' + self.selected_charge.id + '/void',
				dataType: 'json',
				success: function(d) {
					self.profiles.selected.set(d);
					$('a#void-charge-submit').removeClass('disabled');
					self.goBack();
					self.req = false;
				},
				error: function(d) {
					$('p#void-charge-error').html(d.responseText);
					$('a#void-charge-submit').removeClass('disabled');
					self.req = false;
				}
			});
		}
	},

	destroy: function(e) {
		if(e) e.preventDefault();
		if(this.req == false) { // check request lock
			var self = this; // preserve scope
			$('a#remove-charge-submit').addClass('disabled'); // disable button
			this.req = true; // set request lock
			$.ajax({
				type: 'delete',
				url: '/profiles/' + self.profiles.selected.id + '/charges/' + self.selected_charge.id,
				dataType: 'json',
				success: function(d) {
					self.profiles.selected.set(d);
					$('a#remove-charge-submit').removeClass('disabled');
					self.goBack();
					self.req = false;
				},
				error: function(d) {
					$('p#remove-charge-error').html(d.responseText);
					$('a#remove-charge-submit').removeClass('disabled');
					self.req = false;
				}
			});
		}
	},

	create: function(e) {
		e.preventDefault();
		if(this.req == false) {
			this.req = true;
			var self = this;
			$('input#new-charge-submit').toggleSubmit();
			var data = $('form#new-charge-form').serializeObject();
			var charge = new ChargeModel();
			$.ajax({
				type: 'post',
				url: '/profiles/' + self.profiles.selected.id + '/payment_methods/' + self.selected_pm_id + '/charges',
				dataType: 'json',
				data: $('form#new-charge-form').serializeObject(),
				success: function(d) {
					$('input#new-charge-submit').toggleSubmit();
					charge.set(d);
					self.collection.add(charge);
					self.profiles.selected.get('_charges').push(d);
					self.goBack();
					self.req = false;
				},
				error: function(d) {
					$('p#new-charge-error').html(d.responseText);
					$('input#new-charge-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	goBack: function(e) {
		if(e) e.preventDefault();
		var payments = _.template($('#edit-profile-payments-tmpl').html());
		$('div#edit-profile-payments').html(payments(this.profiles.selected.attributes));
	},

	update: function(e) {
		if(e) e.preventDefault();
		if(this.req == false && this.selected_charge) {
			this.req = true;
			var self = this;
			$('input#edit-charge-submit').toggleSubmit();
			$.ajax({
				type: 'put',
				url: '/profiles/' + self.profiles.selected.id + '/charges/' + self.selected_charge.id,
				dataType: 'json',
				data: $('form#edit-charge-form').serializeObject(),
				success: function(d) {
					$('input#edit-charge-submit').toggleSubmit();
					_.extend(self.selected_charge, d)
					self.goBack();
					self.req = false;
				},
				error: function(d) {
					$('p#edit-charge-error').html(d.responseText);
					$('input#edit-charge-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	renderEditForm: function(e) {
		if(e) e.preventDefault();
		var tmpl = _.template($('#edit-charge-tmpl').html());
		chargeID = $(e.currentTarget).attr('data-id');
		var charge = _.find(this.profiles.selected.get('_charges'), function(c) {
			return c.id == chargeID;
		});
		this.selected_charge = charge;
		$('div#edit-profile-payments').html(tmpl(charge));
	},

	renderNewForm: function(e) {
		alert('sup');
		if(e) e.preventDefault();
		this.selected_pm_id = $(e.currentTarget).attr('data-id');
		var tmpl = _.template($('#new-charge-tmpl').html());
		$('div#edit-profile-payments').html(tmpl());

	},

});
