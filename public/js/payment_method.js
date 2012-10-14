
PaymentMethod = {};

PaymentMethod.result = {};

// I abstracted out these ajaxy functions with a big ol' balanced callback so
// that i can reuse it in three different places (incoming dashboard new
// profile or add to existing subscription, and profile creation through the
// share page)
// Note: this could be built into our backbone structure such as inside the
// PaymentMethod model.
PaymentMethod.create = function(data) {
	// error checking. We'll do it manually so the messages can be more easily pretty.
	var ret = {};
	balanced.card.create(data, function(resp) {
		ret = resp;
	});
	return ret;
};

PMView = Backbone.View.extend({
	req: false,

	initialize: function(options) {
		this.parentView = options.parentView; // this way the ProfileView's actions are accessible
	},

	events: {
		'click #new-pm-btn': 'renderNewForm',
		'click #new-pm-submit': 'create',
		'click #cancel-new-pm': 'renderNewForm',
		'change .new-payment-method-type': 'getType',
	},

	selectedSubID: null, // we'll use this for assigning payment methods to subscriptions
	renderNewForm: function(e) {
		e.preventDefault();
		this.selectedSubID = $(e.currentTarget).parents('tr').data('id');
		$('#new-pm-modal').modal('show');
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

	create: function(e) {
		if(e) e.preventDefault();
		var self = this;
		$('#new-pm-submit').attr('disabled',true);
		$('#ajax-loader').show();
		var profile = this.collection.selected;
		var data = $('#new-pm-form').serializeObject();
		$('#new-pm-form .alert').hide(); // hide any previous errors or messages

	},


});
