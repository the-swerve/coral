// Customers/payees/subscribers/members/clients/etc

Profile = Backbone.Model.extend({
	urlRoot: '/profiles',
	initialize: function() { }
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

	},

	initJquery: function() {
		var self = this;
		$('.edit-profile-button').click( // XXX wat bleh put in events hash
			function() {
				var clicked = self.collection.get($(this).attr('id'));
				if(clicked == self.collection.selected) {
					$('.edit-profile').hide();
					$('.edit-profile-button').css('fontWeight','normal');
					self.collection.selected = null;
				} else {
					self.collection.selected = self.collection.get($(this).attr('id'));
					$('.edit-profile-button').show();
					$('.edit-profile-button').css('fontWeight','normal');
					$(this).css('fontWeight','bold');
					var row = $(this).next();
					$('.edit-profile').hide();
					$(this).children('.edit-profile-info').show();
					$('p#edit-profile-error').html(''); // clear form errors
					// Compile and render form template
					var tmpl = _.template($('#edit-profile-tmpl').html());
					attrs = self.collection.selected.attributes;
					editView = '<td>' + tmpl(attrs) + '</td>';
					row.html(editView);
					row.show();
				}
			}
		);
	},

	events: {
		'click #new-profile-button': 'renderNewForm',
		'click #new-profile-submit': 'create',
		'click #edit-profile-submit': 'update',
		'click #remove-profile-button': 'renderRemoveForm',
		'click #remove-profile-submit': 'destroy',
		'click .dropdown-item': 'renderTable',
		'click #share-plan-submit': 'invitePeople',
		'click #remove-profile-row': 'removeRow',
		'click #new-profile-row': 'addRow',
		'click #payments-button': 'showPayments'
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

	update: function(e) {
		e.preventDefault();
		if(this.req == false) {
			this.req = true;
			$(e.currentTarget).hide();
			$(e.currentTarget).siblings('.loader').fadeIn();
			var self = this;
			var data = $('.edit-profile-form').serializeObject();
			var profile = this.collection.selected;
			profile.save(data, {
				success: function(model, response) {
					$('.edit-profile').hide();
					$('.edit-profile-button').show();
					self.req = false;
					self.renderTable();
				},
				error: function(model, response) {
					$('p#edit-profile-error').html(response.responseText);
					$('input#edit-profile-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
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
		$('#profile-table-container').hide();
		$('#profile-table-container').html(table({profiles: filtered_profiles}));
		$('#profile-table-container').slideDown('slow');
		this.initJquery();
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
		'click #new-pm-button': 'render',
		'click #new-payment-method-submit': 'create',
		'click .back-to-profile': 'goBack',
		'change .new-payment-method-type': 'getType',
		'click .remove-pm-button': 'renderRemoveForm',
		'click #remove-pm-submit': 'destroy',
	},

	render: function(e) {
		if(e) e.preventDefault();
		var tmpl = _.template($('#new-payment-method-tmpl').html());
		$('div#edit-profile-payments').html(tmpl(this.collection.selected.toJSON()));
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

	create: function(e) {
		if(e) e.preventDefault();
		if(this.req == false) {
			this.req = true;
			var self = this;
			$(e.currentTarget).hide();
			$(e.currentTarget).siblings('.loader').show();
			var profile = this.collection.selected;
			$.ajax({
				type: 'post',
				url: '/profiles/' + profile.id + '/payment_methods',
				dataType: 'json',
				data: $('#new-payment-method-form').serializeObject(),
				success: function(d) {
					$('input#new-payment-method-submit').toggleSubmit();
					profile.get('_payment_methods').push(d);
					self.goBack();
					self.req = false;
				},
				error: function(d) {
					$('p#new-payment-method-error').html(d.responseText);
					$('input#new-payment-method-submit').toggleSubmit();
					self.req = false;
				}
			});
		}
	},

	renderRemoveForm: function(e) {
		e.preventDefault();
		this.selected_id = $(e.currentTarget).attr('data-id');
		tmpl = _.template($('#remove-pm-tmpl').html());
		$('div#edit-profile-payments').html(tmpl());
	},

	destroy: function(e) {
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
					self.goBack();
				},
				error: function(d) {
					$('p#remove-pm-error').html(d.responseText);
					$('a#remove-pm-submit').removeClass('disabled');
					self.req = false;
				}
			});
		}
	},

});

SubView = Backbone.View.extend({
	initialize: function(options) {
	},

	events: {
		'change #new-sub-selector': 'showStarting',
	},

	showStarting: function() {
		$('#new-sub-dates').removeClass('hide');
	},
});
