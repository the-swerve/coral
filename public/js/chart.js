
// NOTES
// I settled on Flot for the charting library. Its API is nice and simple,
// it looks pretty good, and it seems to perform pretty well.
// Alternatives I considered: jqplot, d3
//
// flotcharts.org
// Examples: http://people.iola.dk/olau/flot/examples/
// API: https://github.com/flot/flot/blob/master/API.md

ChartView = Backbone.View.extend({
	initialize: function(options) {
		var d1 = [[0, 200],[1,220],[2,240],[3,260]];
		var d2 = [[0, 100],[1,110],[2,130],[3,150]];
		$.plot(
			$('#chart'),
			// data
			[{
				data: d1,
				bars: {
					show:true,
					barWidth: 0.3,
					align: 'center',
					fillColor: { colors: [ { opacity: 0.8 }, {opacity: 0.1 } ] },
				}
			},
			{
				data: d2,
				bars: {
					show:true,
					barWidth: 0.3,
					align: 'center',
					fillColor: { colors: [ { opacity: 0.8 }, {opacity: 0.1 } ] },
				}
			},
				],
			// options
			{
				yaxis: {
					max: 300,
					tickLength: 0,
				},
				xaxis: {
					tickSize: 1,
					tickDecimals: 0,
					tickLength: 0,
				},
			}
		);
	},
});
