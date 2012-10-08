
// Highest level view, encompassing the whole app.
Router = Backbone.Router.extend({
	initialize: function() {

		// Instatiate models
		this.account = new Account.Model();
		this.plans = new Plan.Collection();
		this.profiles = new ProfileCollection();
		this.charges = new ChargeCollection();

		// Initialize child views
		// Top bar -- account.js
		this.titleView = new Account.View.title({model: this.account, el: $('h1#account-name')});
		this.settingsView = new Account.View.settings({model: this.account, el: $('div#account')});
		this.editAcctView = new Account.View.edit({model: this.account, el: $('div#edit-account')});
		this.helpView = new Account.View.help({model: this.account, el: $('div.container')});
		this.baView = new BAView({model: this.account, el: $('div#edit-account')});

		// Data visualization -- chart.js
		this.chartView = new ChartView({el: $('div.visualization')});

		// Member table -- table.js
		this.tableView = new Plan.View.Table({el: $('div.data'), plans: this.plans, profiles: this.profiles});
	},

	routes: {
		'edit/account' : 'editAccount',
	},

	editAccount: function() {
		this.settingsView.render();
	},

});

TableView = Backbone.View.extend({
});
