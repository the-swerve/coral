
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
