


$(document).ready(function() {


	$('a#get-help').tooltip({placement: 'bottom'});
	$('a#settings-button').tooltip({placement: 'bottom'});
	$('a#logout-button').tooltip({placement: 'bottom'});

	// Clickable rows for person profiles
	// TODO generalize this
	//$('div#profile-settings-dialog').bootstrap_dialog({title: "Profile Settings", autoOpen: false});
	$('table.clickable-rows tr').click(function(event) {
		event.preventDefault();
		$('p.form-error').html('');
		$('input#edit-profile-name').attr('value', $(this).children('td.profile-name').html());
		$('input#edit-profile-email').attr('value', $(this).children('td.profile-email').html());
		$('input#edit-profile-id').attr('value', $(this).attr('id'));
		$('div#edit-profile').modal('show');
	});

	function modalize(prefix) {
		$('a#' + prefix + '-button').click(function(e) {
			e.preventDefault();
			$('p#' + prefix + '-error').html(''); // Make sure form errors are blank
			$('div#' + prefix).modal('show');
		});
	};
	modalize('settings');
	modalize('edit-plan');
	modalize('share-plan');
	modalize('new-plan');
	modalize('new-profile');
	modalize('edit-profile');

});

//$(document).ready(function() {
//
//	// Pop the new plan dialog of none exist yet.
//	if($('input#empty-plans').attr('value') == "true") {
//		$('div#new-plan').modal('show');
//	}
//
//	function filter(selector, query) {
//		$(selector).each(function() {  
//			($(this).text().search(new RegExp(query, "i")) < 0) ? $(this).hide().removeClass('visible') : $(this).show().addClass('visible');  
//		});  
//  };  
//
//	$('a.dropdown-item').click(function(event) {
//		event.preventDefault();
//		var val = $(this).html();
//		$('strong#dropdown-active').html(val);
//		$('span#selected-plan').html(val);
//		if(val == "All") { val = ""; }
//		filter('tbody tr', val);
//		filter('div#plan-descriptions p', val);
//	});
//
//
//
//	// Save account settings.
//	$('input#save-account-settings').bind('click', function(event) {
//		event.preventDefault();
//		$(this).attr('class',"btn disabled");
//		$(this).attr('value',"Saving...");
//		$.ajax({
//			type: 'PUT',
//			url: "/account",
//			dataType: 'json',
//			data: {account: $('form#settings-form').serializeObject()},
//			success: function(data) {
//				if(data.account) {
//					$('input#save-account-settings').attr('class',"btn");
//					$('input#save-account-settings').attr('value',"Save");
//					$('div#settings').modal('hide');
//					$('h2#account-name').html(data.account.name);
//				} else if (data.error) {
//					$('input#save-account-settings').attr('class',"btn");
//					$('input#save-account-settings').attr('value',"Save");
//					$('p.form-error').html(data.error);
//				} else {
//					$('input#save-account-settings').attr('class',"btn");
//					$('input#save-account-settings').attr('value',"Save");
//					$('p.form-error').html('There was an error :/');
//				}
//			},
//			error: function(data) {
//				$('input#save-account-settings').attr('class',"btn");
//				$('input#save-account-settings').attr('value',"Save");
//			}
//		});
//	});
//
//	// Create a new profile
//	$('input#new-profile-submit').bind('click', function(event) {
//		event.preventDefault();
//		$(this).attr('class',"btn disabled");
//		$(this).attr('value',"Saving...");
//		$.ajax({
//			type: 'POST',
//			url: "/profiles",
//			dataType: 'json',
//			data: {profile: $('form#new-profile-form').serializeObject()},
//			success: function(data) {
//				if(data.profile) {
//					$('input#new-profile-submit').attr('class',"btn");
//					$('input#new-profile-submit').attr('value',"Save");
//					$('div#new-profile').modal('hide');
//					$('table#profiles-table tr:last').after(
//						"<tr id=\"" + data.profile.id +
//							"\"><td class=\"profile-name\">" +
//							data.profile.name +
//							"</td><td class=\"profile-email\">" +
//							data.profile.email +
//							"</td><td class=\"profile-subs\">" +
//							data.profile.subscriptions +
//							"</td><td class=\"profile-state\">" +
//							data.profile.state +
//							"</td></tr>"
//					);
//				} else if (data.error) {
//					$('input#new-profile-submit').attr('class',"btn");
//					$('input#new-profile-submit').attr('value',"Save");
//					$('p.form-error').html(data.error);
//				} else {
//					$('input#new-profile-submit').attr('class',"btn");
//					$('input#new-profile-submit').attr('value',"Save");
//					$('p.form-error').html('There was an error :/');
//				}
//			},
//			error: function(data) {
//				$('p.form-error').html('There was an error :(');
//				$('input#new-profile-submit').attr('class',"btn");
//				$('input#new-profile-submit').attr('value',"Save");
//			}
//		});
//	});
//
//
//	// Edit profile
//	$('input#edit-profile-submit').bind('click', function(event) {
//		event.preventDefault();
//		$(this).attr('class',"btn disabled");
//		$(this).attr('value',"Saving...");
//		$.ajax({
//			type: 'PUT',
//			url: "/profiles/" + $('input#edit-profile-id').attr('value'),
//			dataType: 'json',
//			data: {profile: $('form#edit-profile-form').serializeObject()},
//			success: function(data) {
//				if(data.profile) {
//					$('input#edit-profile-submit').attr('class',"btn");
//					$('input#edit-profile-submit').attr('value',"Save");
//					$('div#edit-profile').modal('hide');
//					$('tr#' + $('input#edit-profile-id').attr('value')).html(
//							"<td class=\"profile-name\">" +
//							data.profile.name +
//							"</td><td class=\"profile-email\">" +
//							data.profile.email +
//							"</td><td class=\"profile-subs\">" +
//							data.profile.subscriptions +
//							"</td><td class=\"profile-state\">" +
//							data.profile.state +
//							"</td>"
//					);
//				} else if (data.error) {
//					$('input#edit-profile-submit').attr('class',"btn");
//					$('input#edit-profile-submit').attr('value',"Save");
//					$('p.form-error').html(data.error);
//				} else {
//					$('input#edit-profile-submit').attr('class',"btn");
//					$('input#edit-profile-submit').attr('value',"Save");
//					$('p.form-error').html('There was an error :/');
//				}
//			},
//			error: function(data) {
//				$('p.form-error').html('There was an error :(');
//				$('input#new-profile-submit').attr('class',"btn");
//				$('input#new-profile-submit').attr('value',"Save");
//			}
//		});
//	});
//
google.load('visualization', '1.0', {'packages':['corechart']});

function drawVisualization() {
	// Some raw data (not necessarily accurate)
	var data = google.visualization.arrayToDataTable([
		['Month', 'Plan 1', 'Plan 2', 'Plan 3', 'Plan 4', 'Plan 5', 'Subscribers'],
		['January',  165,      938,         522,             998,           450,      614.6],
		['February',  135,      1120,        599,             1268,          288,      682],
		['March',  157,      1167,        587,             807,           397,      623],
		['April',  139,      1110,        615,             968,           215,      609.4],
		['May',  136,      691,         629,             1026,          366,      569.6]
	]);

	var options = {
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
