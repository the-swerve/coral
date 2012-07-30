
ChartView = Backbone.View.extend({

	initialize: function() {
		$.jqplot('chart', [[1,2],[3,4],[4,5]], {

			seriesDefaults: {
				renderer: $.jqplot.BarRenderer
			},
		});
	},
});
