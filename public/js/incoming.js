
// Highest level router, encompassing the whole app.
// initializes all the views
// TODO get some routes workin
Router = Backbone.Router.extend({
	initialize: function() {

		// Instatiate models
		this.account = new Account.Model();
		this.plans = new Plan.Collection();
		this.profiles = new Profile.Collection();
		this.charges = new ChargeCollection();

		// Initialize child views
		// Top bar -- account.js
		this.titleView = new Account.View.Title({model: this.account, el: $('h1#account-name')});
		this.settingsView = new Account.View.Settings({model: this.account, el: $('div#account')});
		this.editAcctView = new Account.View.Edit({model: this.account, el: $('div#edit-account')});
		this.helpView = new Account.View.Help({model: this.account, el: $('div.container')});
		this.baView = new Account.View.Bank({model: this.account, el: $('div#edit-account')});

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
