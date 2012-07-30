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

	initialize: function() {
		this.collection.bind('reset', this.renderTable, this);
	},

	events: {
			'click #new-profile-submit': 'renderTable',
			'click .dropdown-item': 'renderTable',
			'click #new-profile-submit': 'fetchCharges',
			'click .edit-charge-button': 'renderEditForm',
			'click #new-charge-button': 'renderNewForm',
//		'click #new-charge-submit': 'create',
//		'click .edit-charge-button': 'renderEditForm',
//		'click #edit-charge-submit': 'update',
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

	fetchCharges: function() {
		this.collection.fetch();
	},

	renderBlankTable: function() {
	},

	renderTable: function(newCharges) {
		// Filter charges by the selected plan - XXX redundant with profile renderTable
		var activePlanID = $('span.active-plan-id').attr('id');
		if(activePlanID == '') { // No plan selected, show all charges
			var filtered_charges = this.collection.toJSON();
		} else { // a plan has been selected. Filter out charges
			var filtered_charges = this.collection.filter(function(c) {
				return c.get('plan').id == activePlanID;
			}); filtered_charges = (new ChargeCollection(filtered_charges)).toJSON();
		}
		var table = _.template($('#charge-table-tmpl').html());
		$('#charge-table').html(table({charges: filtered_charges}));

		// jquery code for the payment table show/hide
		// XXX this should not run on every renderTable. However, the DOM elements
		// of that table are not accessible until *after* rendered since they're in
		// a template
		$('table#charges-table tbody').hide();
		$('#payment-history-header').toggle(function(e) {
			e.preventDefault();
			$('#payment-history-chevron').removeClass('icon-chevron-right');
			$('#payment-history-chevron').addClass('icon-chevron-down');
			$('#charges-table tbody').show();
		},
		function(e) {
			e.preventDefault();
			$('#payment-history-chevron').addClass('icon-chevron-right');
			$('#payment-history-chevron').removeClass('icon-chevron-down');
			$('#charges-table tbody').hide();
		});
	},

	renderEditForm: function(e) {
		e.preventDefault();
		this.$('p#charge-error').html(''); // clear errors
		var selectedCharge = this.collection.get($(e.currentTarget).attr('id')); // fetch selected charge

		//  Compile and render the form template
		var table = _.template($('#charge-form-tmpl').html());
		$('div#edit-charge div.modal-body').html(table(selectedCharge.attributes));

		this.$('div#edit-charge').modal('show'); // display edit charge dialog
	},

	renderNewForm: function(e) {
		e.preventDefault();
		this.$('div#edit-profile').modal('hide'); // hide edit profile dialog. 
		this.$('p#charge-error').html(''); // clear errors
		this.$('form#new-charge-form input').html(''); // clear form
		var activePlanID = $('span.active-plan-id').attr('id'); // get selected plan id
		if(activePlanID) {
			this.$('#new-charge-plan-id').val(activePlanID); // inject selected plan id into charge form
			this.$('#new-charge-towards').html('Towards ' + $('#dropdown-active').html()); // inject selected plan id into charge form
		}
		var activeProfileID = $('#edit-profile-id').val(); // get selected profile id
		this.$('div#new-charge h3').html('Charging ' + $('#edit-profile-name').val()); // inject payee name into charge form
		this.$('div#new-charge').modal('show'); // display edit charge dialog
	},

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
