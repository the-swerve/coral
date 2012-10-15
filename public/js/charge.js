// Charges/payments/transactions

Charge = {};
Charge.View = {};

Charge.View.New = Backbone.View.extend({
	initialize: function(options) {
		this.parentView = options.parentView;
		this.req = false;
	},
	events: {
		'click .new-charge-btn' : 'selectPM',
		'click #new-charge-submit' : 'create',
	},
	selectPM: function(e) {
		e.preventDefault();
		this.pmID = $(e.currentTarget).parents('tr').data('id'); // the ID of the payment method is in 'data-id' of the table row
		this.render();
	},
	render: function() {
		$('#new-charge-modal').modal('show');
		$('#new-charge-form .alert').hide(); // make sure everything is reset
		$('#new-charge-submit').attr('disabled',false);
	},
	create: function(e) {
		e.preventDefault();
		if(this.req == false) {
			this.req = true;
			var self = this;
			$('#new-charge-submit').attr('disabled',true);
			$('#ajax-loader').show();
			$('#new-charge-form .alert-error').hide();
			var data = $('#new-charge-form').serializeObject();
			data['amount'] = data['amount'] * 100; // Coral accepts amounts in cents only
			var profileID = this.parentView.collection.selected.id; // pmID, the payment method ID, is set in selectPM
			$.ajax({
				type: 'post', dataType: 'json',
				url: '/profiles/' + profileID + '/payment_methods/' + self.pmID + '/charges',
				data: data,
				success: function(d) {
					$('#new-charge-modal').modal('hide');
					$('.modal-backdrop').remove();
					$('#new-charge-submit').attr('disabled',false);
					$('#ajax-loader').hide();
					self.parentView.collection.selected.set(d);
					self.parentView.render();
					self.req = false;
				},
				error: function(d) {
					$('#new-charge-submit').attr('disabled',false);
					$('#ajax-loader').hide();
					$('#new-charge-form .alert-error').html(d.responseText).show();
					self.req = false;
				}
			}); // end $.ajax()
		} // end if(this.req == false)
	}, // end create
});

Charge.View.Remove = Backbone.View.extend({
	initialize: function(options) {
		this.parentView = options.parentView;
		this.req = false;
	},
	events: {
		'click .remove-charge-btn' : 'selectCharge',
		'click #remove-charge-submit' : 'destroy',
	},
	selectCharge: function(e) {
		e.preventDefault();
		this.chargeID = $(e.currentTarget).parents('tr').data('id');
		this.render();
	},
	render: function() {
		$('#remove-charge-modal').modal('show');
	},
	destroy: function(e) {
		e.preventDefault();
		if(this.req == false) {
			this.req = true;
			var self = this;
			var profileID = this.parentView.collection.selected.id;
			$('#remove-charge-modal .alert').hide();
			$('#remove-charge-submit').attr('disabled',true);
			$('#ajax-loader').show();
			$.ajax({
				type: 'delete',
				url: '/profiles/' + profileID + '/charges/' + self.chargeID,
				dataType: 'json',
				success: function(d) {
					$('#remove-charge-modal').hide();
					$('.modal-backdrop').remove();
					$('#remove-charge-submit').attr('disabled',false);
					$('#ajax-loader').hide();
					self.parentView.collection.selected.set(d);
					self.parentView.render();
					self.req = false;
				},
				error: function(d) {
					$('#remove-charge-submit').attr('disabled',false);
					$('#ajax-loader').hide();
					$('#remove-charge-modal .alert-error').html(d.responseText).show();
					self.req = false;
				}
			});
		}
	},
}); // end Charge.View.Remove

/* 

Scrap heap:

	events: {
			'click .edit-charge-button': 'renderEditForm',
			'click .new-charge-btn': 'renderNewForm',
			'click #remove-charge-button': 'renderRemoveForm',
			'click #void-charge-button': 'renderVoidForm',
			'click #new-charge-submit': 'create',
			'click #edit-charge-submit': 'update',
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
*/
