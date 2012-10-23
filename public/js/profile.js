// Customers/payees/subscribers/members/clients/etc

Profile = {};
Profile.View = {};

Profile.Model= Backbone.Model.extend({
	urlRoot: '/profiles',
	initialize: function() {
	}
});

Profile.Collection = Backbone.Collection.extend({
	model: Profile.Model,
	url: '/profiles',
	initialize: function() { this.selected = null; }
});

Profile.View.Table = Backbone.View.extend({
	initialize: function(options) {
		var self = this;
		this.collection.bind('reset', function() {
			self.render();
		});
	},

	render: function() {
		var table = _.template($('#profile-table-tmpl').html());
		$('#profiles-container').html(table({profiles: this.collection}));
		$('#profiles-container').slideDown('slow');
	}
});

// Initialized by Plan.View.Table when you click on a row
Profile.View.Details = Backbone.View.extend({
	initialize: function(options) {
		this.tableView = options.tableView;
		// When instantiating Profile.View.Details, pass in the ID of the selected profile as selectedID
		this.plans.selected = null; // deselect any plan
		$('#plan-nav li').removeClass('active'); // deselect plan visually

		// Instantiate child views (views that are embedded inside the profile details view)
		this.editView = new Profile.View.Edit({ el: this.el, collection: this.collection, parentView: this});
		this.newPMModal = new PaymentMethod.View.New({el: this.el, parentView: this});
		this.remPMModal = new PaymentMethod.View.Remove({el: this.el, parentView: this});
		this.newCharge = new Charge.View.New({el: this.el, parentView: this});
		this.remCharge = new Charge.View.Remove({el: this.el, parentView: this});
		this.newProfileModal = new Profile.View.New({el: this.el, parentView: this, collection: this.collection, plans: this.plans});
	},
	events: {
		'click .view-profile-button': 'viewProfile',
	},
	editField: function(e) {
		e.preventDefault();
		// get the div parent of the 'edit' button
		// this way we can scope our view within the edit field box
	},
	viewProfile: function(e) {
		e.preventDefault();
		var sid = $(e.currentTarget).data('id'); // get id of clicked profile, which is in the <tr>
		this.collection.selected = this.collection.get($(e.currentTarget).data('id'));
		$('ul#plan-nav').children('li').removeClass('active');
		this.render();
	},
	req: false,
	render: function() {
		// Compile and render form template
		var tmpl = _.template($('#edit-profile-tmpl').html());
		$('#profiles-container').html(tmpl(this.collection.selected.attributes));
	},
});

Profile.View.Edit = Backbone.View.extend({
	initialize: function(options) {
		// events
		var self = this;
		this.collection.on('change:name', function() {
			$('#profile-name').html(self.collection.selected.get('name'));
		});
	},
	events: {
		'click .edit-field-btn': 'showField',
		'click .cancel-edit': 'hideField',
		'keypress .field-controls input': 'saveField',
		'click #profile-scratchpad-submit': 'saveScratch',
	},
	// Note: you can eliminate the redundancy of the following two functions by
	// using the toggle() method, but I was having problems with it
	// double-toggling when you hit the edit link. I have no idea why.
	showField: function(e) {
		// infoGroup is the div element that holds the input and buttons and whatnot
		// it is set in this.getField()
		if(e) { // if a click event, get the selected field
			e.preventDefault();
			this.infoGroup = $(e.currentTarget).parents('.info-group');
		}
		this.infoGroup.children('.field-name').children('.edit-field-btn').hide();
		this.infoGroup.children('.profile-field').hide();
		this.infoGroup.children('.field-name').children('.save-info').show();
		this.infoGroup.children('.field-controls').show();
		return this;
	},
	hideField: function(e) {
		if(e) e.preventDefault();
		this.infoGroup.children('.field-name').children('.edit-field-btn').show();
		this.infoGroup.children('.profile-field').show();
		this.infoGroup.children('.field-name').children('.save-info').hide();
		this.infoGroup.children('.field-name').children('.save-status').hide();
		this.infoGroup.children('.field-controls').hide();
		return this;
	},
	saveField: function(e) {
		if(e.which != 13) return this;
		// this.infoGroup will be the selected div.info-group
		var input = this.infoGroup.children('.field-controls').children('input');
		var btn = this.infoGroup.children('.field-controls')
		// UI bits
		this.infoGroup.children('.field-name').children('.save-info').hide();
		this.infoGroup.children('.field-name').children('.save-status').show();
		$('#edit-profile .alert').hide();
		$('#ajax-loader').show();
		input.attr('disabled',true);
		// AJAX bits
		var self = this;
		var name = input.attr('name');
		var val = input.val();
		var data = {};
		data[name] = val; // i have to initialize the data hash this way because if i do {name : val}, javascript turns 'name' into a string
		var previous = this.collection.selected.get(name); // for rolling back 
		this.collection.selected.save(data,
			{
				success: function(m,r) {
					input.attr('disabled',false);
					$('#ajax-loader').hide();
					self.infoGroup.children('.profile-field').html(val);
					self.hideField();
				},
				error: function(m,r) {
					input.attr('disabled',false);
					m.set(name, previous); // roll back field
					input.val(m.get(name)); // reset input
					$('#ajax-loader').hide();
					$('#edit-profile .alert-error').html(r.responseText + ' - ' + val).show();
					self.hideField();
				}
			}
		);
	},
	saveScratch: function(e) {
		// this may not need a separate function from saveField
		e.preventDefault();
		$('#ajax-loader').show();
		$(e.currentTarget).hide();
		$(e.currentTarget).siblings('.save-status').show();
		this.collection.selected.save({'info' : $('#profile-scratchpad').val()},
			{
				success: function(d) {
					$('#ajax-loader').hide();
					$(e.currentTarget).show();
					$(e.currentTarget).siblings('.save-status').hide();
				},
				error: function(d) {
					alert(d.responseText);
					$(e.currentTarget).show();
					$(e.currentTarget).siblings('.save-status').hide();
				}
			}
		);
	},
});

Profile.View.New = Backbone.View.extend({
	initialize: function(options) {
		this.parentView = options.parentView;
		this.plans = options.plans;
	},
	events: {
		'click #new-profile-btn': 'newProfile',
		'click #new-profile-submit' : 'saveInfo',
		'click #new-profile-pm-submit' : 'savePM',
		'click #new-profile-starting-submit' : 'setStarting',
		'click #skip-pm-form' : 'skipPM',
	},
	newProfile: function(e) {
		e.preventDefault();
		this.render();
	},
	render: function() {
		// display the modal
		$('#new-profile-modal').modal('show');
		var tmpl = _.template($('#new-profile-tmpl').html());
		$('#new-profile-modal .modal-body').html(tmpl({}));
	},
	saveInfo: function(e) {
		e.preventDefault();
		// ui stuff
		$('#new-profile-submit').attr('disabled',true);
		$('#ajax-loader').show();
		// ajaxy nonsense. summon the internet
		var self = this;
		var data = $('#new-profile-form').serializeObject();
		data['sub_plan_id'] = this.plans.selected.id;
		(new Profile.Model()).save(data, {
			success: function(model, response) {
				self.collection.add(model);
				self.collection.selected = model;
				$('#new-profile-form').hide();
				$('#new-profile-pm-form').show();
				$('#new-prof-progress').children().addClass('deemph');
				$('#payment-method-title').removeClass('deemph');
				$('#ajax-loader').hide();
			},
			error: function(model, response) {
				$('#new-profile-form .alert-error').html(response.responseText).show();
				$('#new-profile-submit').attr('disabled',false);
				$('#ajax-loader').hide();
			}
		});
		return this;
	},
	savePM: function(e) {
		e.preventDefault();

		$('#new-profile-pm-submit').attr('disabled',true);
		$('#ajax-loader').show();
		$('#new-profile-pm-form .alert-error').hide();

		var self = this;
		var pid = this.collection.selected.id;
		var sid = this.plans.selected.id;
		var data = $('#new-profile-pm-form').serializeObject();
		var subs = this.collection.selected.get('_subscriptions');

		// XXX we should do all this jazz in a PaymentMethod model. definitely.
		var errs = balanced.card.validate(data);
		if(!_.isEmpty(errs)) {
			$('#ajax-loader').hide();
			$('#new-profile-pm-submit').attr('disabled',false);
			// print out the first error message
			$('#new-profile-pm-form .alert-error').html(_.values(err)[0]).show();
			return this;
		}

		balanced.card.create(data, function(response) {
			if(response.status == 201) { // you aight
				// get some of them data tidbits on coral 
				response.data['sub_plan_id'] = sid;
				$.ajax({
					type: 'post',
					url: '/profiles/' + pid + '/payment_methods',
					dataType: 'json',
					data: response.data,
					success: function(d) {
						// the data response will be the profile hash
						self.collection.selected.set(d);
						$('#ajax-loader').hide();
						self.startingForm(); // move to next step
					},
					// coral error.
					// this shouldn't happen since it was ok on balanced. bro you got nerve
					error: function(d) {
						$('#ajax-loader').hide();
						$('#new-profile-pm-form .alert-error').html(d.responseText).show();
						$('#new-profile-pm-submit').attr('disabled',false);
					}
				});
			} else {  // balanced error
				$('#ajax-loader').hide();
				$('#new-profile-pm-submit').attr('disabled',false);
				$('#new-profile-pm-form .alert-error').html(response.error).show();
			}
		});
	}, // end savePM
	setStarting: function(e) {
		e.preventDefault();
		$('#ajax-loader').show();
		$('#new-profile-starting-submit').attr('disabled',true);
		var self = this;
		data = $('#new-profile-starting-form').serializeObject();
		$.ajax({
			type: 'put',
			url: '/profiles/' + self.collection.selected.id + '/plans/' + self.plans.selected.id,
			dataType: 'json',
			data: data,
			success: function(d) {
				$("#ajax-loader").hide();
				$('#new-profile-modal').modal('hide');
				self.collection.selected.set(d);
				self.parentView.render();
			},
			error: function(d) {
				$('#ajax-loader').hide();
				$('#new-profile-starting-submit').attr('disabled',false);
				$('#new-profile-starting-form .alert-error').html(d.responseText).show();
			}
		});
	},
	skipPM: function(e) {
		e.preventDefault();
		$('#new-profile-modal').modal('hide');
		this.parentView.render();
	},
	startingForm: function(e) {
		if(e) e.preventDefault();
		// form ui - have a glass of my kombucha
		$('#new-profile-pm-form').hide();
		$('#new-profile-starting-form').show();
		// title progress thing ui
		// The x.fadeOut(function() { y.fadeIn()}); sequencing was not working at
		// all. I couldn't figure out why. Some fadey shit would be nicer.
		$('#new-prof-progress').children().addClass('deemph');
		$('#starting-date-title').removeClass('deemph');
	},
});


/*

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
*/
