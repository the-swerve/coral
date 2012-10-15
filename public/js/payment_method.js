
PaymentMethod = {};

PaymentMethod.View = {};

PaymentMethod.View.New = Backbone.View.extend({

	initialize: function(options) {
		this.parentView = options.parentView;
		this.req = false;
	},
	events: {
		'click #new-pm-btn': 'newPM',
		'click #new-pm-submit': 'create'
	},
	newPM: function(e) { e.preventDefault(); this.render(); },
	render: function() {
		$('#new-pm-modal').modal('show');
		$('#new-pm-form .alert-error').hide(); // make sure things are reset
	},
	create: function(e) {
		e.preventDefault();
		if(this.req == false) {
			this.req = true;
			$('#new-pm-submit').attr('disabled',true);
			$('#ajax-loader').show();
			$('#new-pm-form .alert-error').hide();
			var self = this;
			var pid = this.parentView.collection.selected.id;
			var data = $('#new-pm-form').serializeObject();

			// XXX we should do all this jazz in a PaymentMethod model. definitely.
			// XXX all this crap is also in Profile.View.New
			var errs = balanced.card.validate(data);
			if(!_.isEmpty(errs)) {
				$('#ajax-loader').hide();
				$('#new-pm-submit').attr('disabled',false);
				// print out the first error message
				$('#new-pm-form .alert-error').html(_.values(errs)[0]).show();
				return this;
			}
			balanced.card.create(data, function(response) {
				if(response.status == 201) { // you aight
					// get some of them data tidbits on coral 
					$.ajax({
						type: 'post',
						url: '/profiles/' + pid + '/payment_methods',
						dataType: 'json',
						data: response.data,
						success: function(d) {
							// the data response will be the profile hash
							self.parentView.collection.selected.set(d);
							$('#ajax-loader').hide();
							$('#new-pm-submit').attr('disabled',false);
							$('#new-pm-modal').modal('hide');
							self.parentView.render();
							self.req = false;
						},
						// coral error.
						// this shouldn't happen since it was ok on balanced. bro you got nerve
						error: function(d) {
							$('#ajax-loader').hide();
							$('#new-pm-form .alert-error').html(d.responseText).show();
							$('#new-pm-submit').attr('disabled',false);
							self.req = false;
						}
					});
				} else {  // balanced error
					alert('hi');
					$('#ajax-loader').hide();
					$('#new-pm-submit').attr('disabled',false);
					$('#new-pm-form .alert-error').html(response.description).show();
					self.req = false;
				}
			});
		}
	}, // end create
});

PaymentMethod.View.Remove = Backbone.View.extend({

	initialize: function(options) {
		this.parentView = options.parentView;
		this.req = false;
	},

	events: {
		'click #remove-pm-btn': 'selectPM',
		'click #remove-pm-submit': 'destroy'
	},

	selectPM: function(e) {
		e.preventDefault();
		this.pmID = $(e.currentTarget).parents('tr').data('id');
		this.render();
	},

	render: function() {
		$('#remove-pm-modal').modal('show');
		$('#remove-pm-form .alert-error').hide(); // make sure things are reset
		$('#remove-pm-submit').attr('disabled',false);
	},

	destroy: function(e) {
		e.preventDefault();
		if(this.req == false) {
			this.req = true;
			var self = this;
			$('#remove-pm-submit').attr('disabled',true);
			$('#ajax-loader').show();
			$('#remove-pm-modal .alert').hide();
			var profileID = this.parentView.collection.selected.id;
			$.ajax({
				type: 'delete',
				url: '/profiles/' + profileID + '/payment_methods/' + self.pmID,
				dataType: 'json',
				success: function(d) {
					self.parentView.collection.selected.set(d);
					// For some unknown reason, Mongoid will not immediately show items as deleted.
					// The solution I found was to make as second request to re-fetch the data, which is fucking dumb.
					self.parentView.collection.selected.fetch().complete(function() {
						$('#remove-pm-submit').attr('disabled',false);
						$('#ajax-loader').hide();
						$('#remove-pm-modal').modal('hide');
						self.parentView.render();
						self.req = false;
					});
				},
				error: function(d) {
					$('#ajax-loader').hide();
					$('#remove-pm-submit').attr('disabled',false);
					$('#remove-pm-modal .alert-error').html(d.responseText).hide();
					self.req = false;
				}
			});
		}
	},

});
