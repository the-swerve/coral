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
	},

	events: {
			'click .edit-charge-button': 'renderEditForm',
			'click #new-charge-button': 'renderNewForm',
			'click #new-charge-submit': 'create',
			'click #edit-charge-submit': 'update',
	},

	create: function(e) {
		e.preventDefault();
		if(this.req == false) {
			this.req = true;
			var self = this;
			$('input#new-charge-submit').toggleSubmit();
			var data = $('form#new-charge-form').serializeObject();
			var charge = new ChargeModel();
			charge.save(data, {
				success: function(model, response) {
					$('input#new-charge-submit').toggleSubmit();
					$('div#new-charge').modal('hide');
					self.collection.add(model);
					self.req = false;
					// show the charges table XXX bleh
					$('a.view-people-button').css('backgroundColor', 'transparent');
					$('a.view-people-button').children('i').removeClass('icon-white');
					$('a.view-payments-button').css('backgroundColor','gray');
					$('a.view-payments-button').css('color','white');
					$('div#profile').fadeOut(function() {
						$('div#charge').fadeIn();
					});
				},
				error: function(model, response) {
					$('p#new-charge-error').html(response.responseText);
					$('input#new-charge-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	update: function(e) {
		e.preventDefault();
		var charge = this.collection.get($('input#edit-charge-id').val());
		// If the charge is paid, the form won't render, which means var charge will be undefined
		if(this.req == false && charge) {
			this.req = true;
			var self = this;
			$('input#edit-charge-submit').toggleSubmit();
			var data = $('form#edit-charge-form').serializeObject();
			charge.save(data, {
				success: function(model, response) {
					$('input#edit-charge-submit').toggleSubmit();
					$('div#edit-charge').modal('hide');
					self.req = false;
				},
				error: function(model, response) {
					$('p#edit-charge-error').html(response.responseText);
					$('input#edit-charge-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	renderEditForm: function(e) {
		e.preventDefault();
		this.$('p#charge-error').html(''); // clear errors
		var selectedCharge = this.collection.get($(e.currentTarget).attr('id')); // fetch selected charge
		if(selectedCharge.get('state') == 'Paid') {
			$('#edit-charge-submit').addClass('disabled');
		} else { $('#edit-charge-submit').removeClass('disabled'); }

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
		this.$('#new-charge-profile-id').val(activeProfileID); // inject selected profile id into charge form
		this.$('div#new-charge h3').html('Charging ' + ($('#edit-profile-name').val() || $('#edit-profile-email').val())); // inject payee name into charge form
		this.$('div#new-charge').modal('show'); // display charge creation dialog
	},

});
