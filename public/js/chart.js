
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
		var d1 = [[0, 200],[1,220],[2,240],[3,260],[4,270],[5,285],[6,300]];
		var months = ['January','February','March','April','May','June','July','August','September','October','November','December']
		$.plot(
			$('#chart-revenue'),
			// data
			[{
				data: d1,
				color: '#cadf72',
				bars: {
					show:true,
					barWidth: 0.3,
					align: 'center',
					fillColor: { colors: [ { opacity: 0.8 }, {opacity: 0.1 } ] },
				}
			},],
			// options
			{
				yaxis: {
					max: 300,
					tickLength: 0,
				},
				xaxis: {
					tickFormatter: function(n,obj) {
						return months[n];
					},
					timeformat: '%Y/%m/%d',
					tickDecimals: 0,
					tickLength: 0,
				},
				grid: {
					backgroundColor: { colors: ['#fff', '#eee'] }
				},
			}
		);

		$.plot(
			$('#chart-signups'),
			// data
			[{
				data: d1,
				color: '#bdd9e6',
				bars: {
					show:true,
					barWidth: 0.3,
					align: 'center',
					fillColor: { colors: [ { opacity: 0.8 }, {opacity: 0.1 } ] },
				}
			},],
			// options
			{
				yaxis: {
					max: 300,
					tickLength: 0,
				},
				xaxis: {
					tickFormatter: function(n,obj) {
						return months[n];
					},
					timeformat: '%Y/%m/%d',
					tickDecimals: 0,
					tickLength: 0,
				},
				grid: {
					backgroundColor: { colors: ['#fff', '#eee'] }
				},
			}
		);
	},
});
