
google.load('visualization', '1.0', {'packages':['corechart']});

function drawVisualization() {
	// Some raw data (not necessarily accurate)
	var data = google.visualization.arrayToDataTable([
		['Month', 'Plan 1', 'Plan 2', 'Plan 3', 'Plan 4', 'Plan 5', 'Signups'],
		['January',  165,      938,         522,             998,           450,      614.6],
		['February',  135,      1120,        599,             1268,          288,      682],
		['March',  157,      1167,        587,             807,           397,      623],
		['April',  139,      1110,        615,             968,           215,      609.4],
		['May',  136,      691,         629,             1026,          366,      569.6]
	]);

	var options = {
		colors: ['#ff9c9c', '#d280ad', '#7a7cb7', '#7fd07f', '#65a59e'],
		title : 'Sample Placeholder Chart',
		vAxis: {title: "Revenue"},
		seriesType: "bars",
		series: {5: {type: "line"}},
		width: '100%',
		height: 370,
		backgroundColor: 'transparent'
	};

	var chart = new google.visualization.ComboChart(document.getElementById('chart'));
	chart.draw(data, options);
};

google.setOnLoadCallback(drawVisualization);
