ChartModel = Backbone.Model.extend({});

ChartView = Backbone.View.extend({

	myRenderer: function(userData, plotObject, options) {
		if(userData = []) {
			var s1 = [22, 23, 26, 20, 29, 21];
			var s2 = [145, 155, 152, 149, 111, 70];
			var s3 = [299, 312, 281, 241, 222, 100];
			var totals = [(s1[0]+s2[0]+s3[0]),(s1[1]+s2[1]+s3[1]),(s1[2]+s2[2]+s3[2]),(s1[3]+s2[3]+s3[3]),(s1[4]+s2[4]+s3[4]),(s1[5]+s2[5]+s3[5])];
			return [s1,s2,s3,totals];
		} else {
			return [[1,1,1,1,1,1],[1,1,1,1,1,1],[1,1,1,1,1,1]]
		}
	},

	initialize: function() {
		var self = this;
		var ticks = ['February','March','April','May','June','July']
		this.chart = $.jqplot('chart', [], {
			title: 'All plans',
			dataRenderer: self.myRenderer,
			animate: true,
			animateReplot: true,

			series: [
				{
					label: 'Basic Membership',
				},
				{ label: 'Short-term Membership' },
				{ label: 'Long-term Membership' },
				{
					label: 'All plans',
					renderer: $.jqplot.LineRenderer,
					rendererOptions: {},
				},
			],

			legend: {
				show: true,
			},

			seriesDefaults: {
				pointLabels: {show: true},
				renderer: $.jqplot.BarRenderer,
				rendererOptions: {
					barWidth: 30,
					barPadding: 8,
					highlightMouseOver: false
				}
			},

			axes: {
				yaxis: {
					tickOptions: {
						formatString: "$%'d"
					},
					min: 0,
				},
				xaxis: {
					renderer: $.jqplot.CategoryAxisRenderer,
					ticks: ticks,
					tickOptions: {
						showGridline: false,
					},
				},
			},

			grid: {
				backgroundColor: 'transparent',
			},
		});
	},

	events: {
		'click .dropdown-item': 'renderFilteredChart',
	},

	renderFilteredChart: function() {
		var activePlanName = $('#dropdown-active').html();
		this.myRenderer('wat');
		this.chart.replot({title: activePlanName, });
	},
});
