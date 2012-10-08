// Customers/payees/subscribers/members/clients/etc

Profile = {};
Profile.View = {};

Profile.Model= Backbone.Model.extend({
	urlRoot: '/profiles',
	initialize: function() {
	}
});

Profile.Collection = Backbone.Collection.extend({
	model: Profile,
	url: '/profiles',
	initialize: function() { this.selected = null; }
});

// Initialized by Plan.View.Table when you click on a row
Profile.View.Details = Backbone.View.extend({
	initialize: function(options) {
		this.plans = options.plans;
		this.tableView = options.tableView;
	},
	events: {},
	req: false,
});

ProfileView = Backbone.View.extend({

	req: false, // used to block simultaneous requests (prevent the form submit from being clicked repeatedly)

	initialize: function(options) {
		this.plans = options.plans;
		var childHash = {collection: this.collection, p: this, el: $('.data-row'), plans: this.plans};
		 
		// child views
		this.pmView = new PMView(childHash);
		this.indexView = new IndexProfileView(childHash);
		this.editView = new EditProfileView(childHash);

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


		'click #share-plan-submit': 'invitePeople',

		'click .view-profile-button': 'renderProfileView',

		'click #payments-button': 'showPayments',
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
				self.collection.add(model);
				self.collection.selected = profile;
				self.renderProfileView();
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
