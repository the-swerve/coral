// Customers/payees/subscribers/members/clients/etc

Profile = Backbone.Model.extend({
	urlRoot: '/profiles',
	initialize: function() {
	}
});

ProfileCollection = Backbone.Collection.extend({
	model: Profile,
	url: '/profiles',
	initialize: function() { this.selected = null; }
});

ProfileView = Backbone.View.extend({

	req: false, // used to block simultaneous requests (prevent the form submit from being clicked repeatedly)

	initialize: function(options) {
		this.collection.bind('reset', this.renderTable, this);
		this.plans = options.plans;
		editProfileView = new EditProfileView({collection: this.collection, el: $('#profiles-container')});

		// events
	},

	events: {
		'click #new-profile-button': 'renderNewForm',
		'click #new-profile-submit': 'create',

		'click #edit-profile-submit': 'update',
		'click #remove-profile-button': 'renderRemoveForm',
		'click #remove-profile-submit': 'destroy',

		'click #new-profile-row': 'addRow',
		'click #remove-profile-row': 'removeRow',

		'click .dropdown-item': 'renderTable',

		'click #share-plan-submit': 'invitePeople',

		'click .view-profile-button': 'renderProfileView',
//		'click #edit-profile-button': 'renderEditForm',
//		'click #cancel-edit-profile': 'renderEditForm', // XXX trash

		'click #payments-button': 'showPayments',
		'click #new-pm-submit': 'createPM',
		'click #remove-pm-submit': 'destroyPM',
		'click .remove-pm-button': 'renderRemovePMForm',

	},

	renderEditForm: function(e) {
		e.preventDefault();
		$('#new-payment-method-form').hide();
		$('#new-pm-button').removeClass('disabled');
		$('#edit-profile-button').toggleClass('disabled');
		$('#edit-profile-form').toggle();
	},

	showPayments: function(e) {
		e.preventDefault();
		var tmp = _.template($('#profile-payments-tmpl').html());
		$(e.currentTarget).parent().parent().after(tmp());
	},

	removeRow: function(e) {
		e.preventDefault();
		$(e.currentTarget).parent().parent().remove();
	},

	addRow: function(e) {
		e.preventDefault();
		$(e.currentTarget).hide();
		$(e.currentTarget).siblings('#remove-profile-row').hide();
		$(e.currentTarget).siblings('.loader').fadeIn();
		var self = this;
		$('input#new-profile-submit').toggleSubmit();
		var data = $(e.currentTarget).parent().serializeObject();
		var profile = new Profile();
		profile.save(data, {
			success: function(model, response) {
				$('input#new-profile-submit').toggleSubmit();
				$('div#new-profile').modal('hide');
				self.collection.add(model);
				self.renderTable();
			},
			error: function(model, response) {
				$(e.currentTarget).show();
				$(e.currentTarget).siblings('#remove-profile-row').show();
				$(e.currentTarget).siblings('.loader').hide();

				$(e.currentTarget).siblings('.form-error').html(response.responseText);
			}
		});
	},

	invitePeople: function(e) {
		e.preventDefault();
		if(this.req == false) {
			this.req = true; // block other requests
			var planID = $('span.active-plan-id').attr('id'); // fetch selected plan id
			var emails = $('textarea#plan-share-emails').val(); // fetch string of emails
			var self = this; // save this object for scope
			$('input#share-plan-submit').val('Sharing...');  // toggle share button
			$('input#share-plan-submit').addClass('disabled');
			$.ajax({ // this is a custom, non-"restful" route, so we need to manually ajax
				type: 'post',
				url: '/share/' + planID, // may resolve to either the plan controller share or account controller share if planID is ''
				dataType: 'json',
				data: {emails: emails},
				success: function(data) {
					$('div#share-plan').modal('hide'); // close sharing dialog
					$('input#share-plan-submit').val('Share'); // reset submit button
					$('input#share-plan-submit').removeClass('disabled');
					_.each(data, function(d) { self.collection.add(new Profile(d)); });
					self.renderTable(); // re-render table
					self.req = false;
				},
				error: function(data) {
					$('div#share-plan').modal('hide'); // close sharing dialog
					self.req = false;
				}
			});
		}
	},

	create: function(e) {
		e.preventDefault();
		if(this.req == false) {
			var self = this;
			$('input#new-profile-submit').toggleSubmit();
			this.req = true;
			var data = $('form#new-profile-form').serializeObject();
			var profile = new Profile();
			profile.save(data, {
				success: function(model, response) {
					$('input#new-profile-submit').toggleSubmit();
					$('div#new-profile').modal('hide');
					self.collection.add(model);
					self.req = false;
					self.renderTable();
				},
				error: function(model, response) {
					$('p#new-profile-error').html(response.responseText);
					$('input#new-profile-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	createPM: function(e) {
		if(e) e.preventDefault();
		var self = this;
		$('#new-pm-submit').attr('disabled',true);
		$('#cancel-new-pm').attr('disabled',true);
		$('#ajax-loader').show();
		var profile = this.collection.selected;
		var data = $('#new-payment-method-form').serializeObject();
		$('#new-payment-method-form .alert').hide(); // hide any previous errors or messages

		// error checking. We'll do it manually so the messages can be more easily pretty.
		if(!balanced.card.isCardNumberValid(data.card_number)) {
			$('#new-payment-method-form .alert-error').show().html('Invalid credit card number.');
			$('#new-pm-submit').attr('disabled',false); // XXX this bit is redundant 
			$('#cancel-new-pm').attr('disabled',false);
			$('#ajax-loader').hide();
		} else if (!balanced.card.isSecurityCodeValid(data.card_number, data.security_code)) {
			$('#new-payment-method-form .alert-error').show().html('Invalid security code.');
			$('#new-pm-submit').attr('disabled',false);
			$('#cancel-new-pm').attr('disabled',false);
			$('#ajax-loader').hide();
		} else if (!balanced.card.isExpiryValid(data.expiration_month, data.expiration_year)) {
			$('#new-payment-method-form .alert-error').show().html('Invalid expiration date.');
			$('#new-pm-submit').attr('disabled',false);
			$('#cancel-new-pm').attr('disabled',false);
			$('#ajax-loader').hide();
		} else { // no client validation errors, post to balanced
			balanced.card.create(data, this.balancedCallbackPM.call(this));
		}
	},

	balancedCallbackPM: function() {
		var self = this; // put self/this in the scope of our callback so we can modify its data
		var profile = self.collection.selected;
		return function(response) {
			switch(response.status) {
				case 201:
					// balanced creation is successful, let's put a copy in coral's db
					$.ajax({
						type: 'post',
						url: '/profiles/' + profile.id + '/payment_methods',
						dataType: 'json',
						data: response.data,
						success: function(d) {
							profile.set(d);
							self.renderProfileView();
							$('#ajax-loader').hide();
						},
						error: function(d) {
							$('#new-payment-method-form .alert').hide();
							$('#new-payment-method-form .alert-error').show().html(d.responseText);
							$('#new-pm-submit').attr('disabled',false);
							$('#cancel-new-pm').attr('disabled',false);
							$('#ajax-loader').hide();
						}
					});
					break;
				case 400:
					// missing field - details in response.error
					$('#new-payment-method-form .alert').hide();
					$('#new-payment-method-form .alert-error').show().html(response.error.description);
					$('#new-pm-submit').attr('disabled',false);
					$('#cancel-new-pm').attr('disabled',false);
					$('#ajax-loader').hide();
					break;
				case 402:
					// could not authorize buyer's credit card - details in response.error
					alert('balanced: 402');
					break;
				case 404:
					// incorrect marketplace URI
					alert('balanced: 404');
					break;
				case 409:
					// incorrect marketplace URI
					$('#new-payment-method-form .alert').hide();
					$('#new-payment-method-form .alert-error').show().html(response.error.description);
					$('#new-pm-submit').attr('disabled',false);
					$('#cancel-new-pm').attr('disabled',false);
					$('#ajax-loader').hide();
					break;
					break;
				case 500:
					// Error on balanced's servers, try again
					alert('balanced: 500');
					break;
			}
		}
	},

	renderRemovePMForm: function(e) {
		e.preventDefault();
		this.selected_id = $(e.currentTarget).attr('data-id');
		$('#remove-pm-modal').modal('show');
	},

	destroyPM: function(e) {
		if(e) e.preventDefault();
		if(this.req == false) { // check request lock
			var self = this; // preserve scope
			$('a#remove-pm-submit').addClass('disabled'); // disable button
			this.req = true; // set request lock
			$.ajax({
				type: 'delete',
				url: '/profiles/' + self.collection.selected.id + '/payment_methods/' + self.selected_id,
				dataType: 'json',
				success: function(d) {
					self.req = false;
					self.collection.selected.set(d);
					$('a#remove-pm-submit').removeClass('disabled');
					$('#remove-pm-modal').modal('hide');
					self.renderProfileView();
				},
				error: function(d) {
					$('p#remove-pm-error').html(d.responseText);
					$('a#remove-pm-submit').removeClass('disabled');
					self.req = false;
				}
			});
		}
	},

	update: function(e) {
		e.preventDefault();
		$('#edit-profile-submit').hide();
		$('#cancel-edit-profile').hide();
		$('#edit-profile-loader').fadeIn();
		$(e.currentTarget).siblings('.loader').fadeIn();
		var self = this;
		var data = $('#edit-profile-form').serializeObject();
		this.collection.selected.save(data, {
			success: function(model, response) {
				self.renderProfileView(); // toggle it off
			},
			error: function(model, response) {
				$('p#edit-profile-error').html(response.responseText);
				$('input#edit-profile-submit').toggleSubmit();
				self.req = false;
			}
		});
	},

	destroy: function() {
		if(this.req == false) { // check request lock
			var self = this; // preserve scope
			$('a#remove-profile-submit').addClass('disabled'); // disable button
			this.req = true; // set request lock
			var profile = this.collection.get($('input#edit-profile-id').val());
			profile.destroy({
				success: function(model, response) {
					this.$('#remove-profile').modal('hide');
					$('a#remove-profile-submit').removeClass('disabled'); // disable button
					self.collection.remove(profile);
					self.req = false;
					self.renderTable();
				},
				error: function(model, response) {
					$('a#remove-profile-submit').removeClass('disabled'); // enable button
					$('p#remove-profile-error').html(response.responseText); // print error
					self.req = false; // release request lock
				}
			});
		}
	},

	renderTable: function() {
		var self = this;
		var filtered_profiles = this.collection.filter(function(p) {
			return _.include(p.get('plan_ids'), self.plans.selected.id);
		});
		filtered_profiles = (new ProfileCollection(filtered_profiles)).toJSON()

		var table = _.template($('#profile-table-tmpl').html());
		var desc = _.template($('#plan-desc-tmpl').html());

		$('#profiles-table-container').hide();
		$('#profiles-container').html(desc({plan: self.plans.selected}) + table({profiles: filtered_profiles}));
		$('#profile-table-container').html(table({profiles: filtered_profiles}));
		$('#profile-table-container').slideDown('slow');
	},

	renderProfileView: function(e) {
		if(e) { // changing selection by clicking on row
			e.preventDefault();
			this.collection.selected = this.collection.get($(e.currentTarget).attr('id'));
			this.plans.selected = null;
			$('#plan-nav li').removeClass('active');
		}
		// Compile and render form template
		var tmpl = _.template($('#edit-profile-tmpl').html());
		$('#profiles-container').html(tmpl(this.collection.selected.attributes));
	},

	renderNewForm: function(e) {
		if(e) e.preventDefault();
		var self = this;

		var tmpl = _.template($('#new-profile-tmpl').html());
		$('#profiles-table tr:last').before(tmpl());
		$('input.sub-plan-id').val(this.plans.selected.id);
	},

	renderRemoveForm: function(e) {
		e.preventDefault();
		$('div#edit-profile').modal('hide');
		$('p#remove-profile-error').html('');
		$('div#remove-profile').modal('show');
	},

});

PMView = Backbone.View.extend({
	req: false,

	initialize: function(options) {
	},

	events: {
		'click #new-pm-btn': 'renderNewForm',
		'click #cancel-new-pm': 'renderNewForm',
		'click .back-to-profile': 'goBack',
		'change .new-payment-method-type': 'getType',
	},

	renderNewForm: function(e) {
		if(e) e.preventDefault();
		var tr = $(e.currentTarget).parents('tr');
		var form = _.template($('#new-pm-form').html());
		tr.after(form({}));
	},

	getType: function(e) {
		var sel = $('.new-payment-method-type option:selected').text();
		if(sel == 'Credit Card') {
			$('.echeck-selected').hide();
			$('.credit-card-selected').show();
		} else if(sel == 'E-check') {
			$('.credit-card-selected').hide();
			$('.echeck-selected').show();
		} else if(sel == '') {
			$('.credit-card-selected').hide();
			$('.echeck-selected').hide();
		}
	},

	goBack: function(e) {
		if(e) e.preventDefault();
		var payments = _.template($('#edit-profile-payments-tmpl').html());
		$('div#edit-profile-payments').html(payments(this.collection.selected.attributes));
	},


});

SubView = Backbone.View.extend({
	initialize: function(options) {
	},

	events: {
		'change #new-sub-selector': 'showStarting',
		'change #sub-pm-select': 'newSubPM',
	},

	showStarting: function() {
		$('#new-sub-dates').removeClass('hide');
	},

	newSubPM: function(e) {
		$('#ajax-loader').show();
		$(e.currentTarget).after('&nbsp; <em>Saving...</em>');
		$(e.currentTarget).attr('disabled',true);
	},

});

EditProfileView = Backbone.View.extend({
	initialize: function(options) {

		var self = this;
		this.collection.on('change:name', function() {
			$('#profile-name').html(self.collection.selected.get('name'));
		});

	},
	
	events: {
		'click .edit-profile-field-btn': 'revealInput',
		'click .save-field-btn': 'saveField',
		'click .cancel-edit': 'cancelEdit',
		'keypress .field-controls input': 'saveField',
		'blur #profile-scratchpad': 'saveScratch',
	},

	revealInput: function(e) {
		e.preventDefault();
		$(e.currentTarget).hide();
		$(e.currentTarget).siblings('.profile-field').hide();
		$(e.currentTarget).siblings('.field-controls').show();
	},

	saveField: function(e) {
		if(e.which && e.which == 13) { // enter key pressed
			var inputData = $(e.currentTarget);
			var inputBtn = $(e.currentTarget).parent().siblings('.edit-profile-field-btn');
		} else if(e.which) {
			return this; // enter key not pressed
		} else { // save button pushed
			var inputBtn = $(e.currentTarget);
			var inputData = inputBtn.siblings('.field-controls').children('input');
		}
		// UI bits
		$('#edit-profile .alert').hide();
		$('#ajax-loader').show();
		inputData.attr('disabled',true);
		// AJAX bits
		var self = this;
		var name = inputData.attr('name'); // name of the field we're editing
		var val = inputData.val(); // new value of the field we're editing
		var data = {};
		data[name] = val; // i have to initialize the data hash this way because if i do {name : val}, javascript turns name into a string
		this.collection.selected.save(data,
			{
				success: function(m,r) {
					inputData.attr('disabled',false);
					$('#ajax-loader').hide();
					inputBtn.show();
					inputData.parent().siblings('.profile-field').html(val).show();
					inputData.parent().hide();
				},
				error: function(m,r) {
					inputData.attr('disabled',false);
					$('#edit-profile .alert-error').html(r.responseText).show();
					$('#ajax-loader').hide();
					inputBtn.show();
					inputData.parent().siblings('.profile-field').show();
					inputData.parent().hide();
				}
			}
		);
	},

	saveScratch: function(e) { // this may not need a separte function from saveField
		$('#ajax-loader').show();	
		this.collection.selected.save({'info' : $('#profile-scratchpad').val()},
			{
				success: function(d) {
					$('#ajax-loader').hide();
				},
				error: function(d) {
					alert(d.responseText);
				}
			}
		);
	},

	successfulSave: function(d) {
	},
	saveError: function(d) {
		$('#ajax-loader').hide();
		alert(':(');
	},

	cancelEdit: function(e) {
		e.preventDefault();
		var p = $(e.currentTarget).parent().parent();
		p.parent().hide();
		p.parent().siblings('.profile-field').show();
		p.parent().siblings('.edit-profile-field-btn').show();
	},
	
});
