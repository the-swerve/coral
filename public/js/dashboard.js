$(document).ready(function() {

	// Pop the new plan dialog of none exist yet.
	if($('input#empty-plans').attr('value') == "true") {
		$('div#new-plan').modal('show');
	}

	function filter(selector, query) {
		$(selector).each(function() {  
			($(this).text().search(new RegExp(query, "i")) < 0) ? $(this).hide().removeClass('visible') : $(this).show().addClass('visible');  
		});  
  };  

	$('a.dropdown-item').click(function(event) {
		event.preventDefault();
		var val = $(this).html();
		$('strong#dropdown-active').html(val);
		$('span#selected-plan').html(val);
		if(val == "All") { val = ""; }
		filter('tbody tr', val);
		filter('div#plan-descriptions p', val);
	});

	// Tooltips
	$('a#get-help').tooltip({placement: 'bottom'});
	$('a#settings-button').tooltip({placement: 'bottom'});
	$('a#logout-button').tooltip({placement: 'bottom'});

	// Clickable rows for person profiles
	//$('div#profile-settings-dialog').bootstrap_dialog({title: "Profile Settings", autoOpen: false});
	$('table.clickable-rows tr').click(function(event) {
		event.preventDefault();
		$('p.form-error').html('');
		$('input#edit-profile-name').attr('value', $(this).children('td.profile-name').html());
		$('input#edit-profile-email').attr('value', $(this).children('td.profile-email').html());
		$('input#edit-profile-id').attr('value', $(this).attr('id'));
		$('div#edit-profile').modal('show');
	});

	// New person bootstrap_bootstrap_dialog
	$('a#new-profile-button').click(function(event) {
		event.preventDefault();
		$('input#new-profile-plan-name').attr('value',$('span#selected-plan').html());
		$('p.form-error').html('');
		$('div#new-profile').modal('show')
	});

	//Settings bootstrap_bootstrap_dialog
	$('a#settings-button').click(function(event) {
		event.preventDefault();
		$('p.form-error').html('');
		$('div#settings').modal('show');
	});

	// New plan dialog
	$('a#new-plan-button').click(function(event) {
		event.preventDefault();
		$('p.form-error').html('');
		$('div#new-plan').modal('show');
	});
	// more options toggle
	$('a#more-options-button').toggle(function(event) {
		event.preventDefault();
		$('div#more-plan-options').slideDown('slow');
		$('a#more-options-button i').attr('class','icon-chevron-up');
	}, function() {
		event.preventDefault();
		$('div#more-plan-options').slideUp('slow');
		$('a#more-options-button i').attr('class','icon-chevron-down');
	});

	// Edit plan dialog
	$('a#edit-plan-button').click(function(event) {
		event.preventDefault();
		$('p.form-error').html('');
		$('div#edit-plan-dialog').modal('show');
	});

	// Share plan dialog
	$('a#share-plan-button').click(function(event) {
		event.preventDefault();
		$('p.form-error').html('');
		$('div#share-plan-dialog').modal('show');
	});


	// Save account settings.
	$('input#save-account-settings').bind('click', function(event) {
		event.preventDefault();
		$(this).attr('class',"btn disabled");
		$(this).attr('value',"Saving...");
		$.ajax({
			type: 'PUT',
			url: "/account",
			dataType: 'json',
			data: {account: $('form#settings-form').serializeObject()},
			success: function(data) {
				if(data.account) {
					$('input#save-account-settings').attr('class',"btn");
					$('input#save-account-settings').attr('value',"Save");
					$('div#settings').modal('hide');
					$('h2#account-name').html(data.account.name);
				} else if (data.error) {
					$('input#save-account-settings').attr('class',"btn");
					$('input#save-account-settings').attr('value',"Save");
					$('p.form-error').html(data.error);
				} else {
					$('input#save-account-settings').attr('class',"btn");
					$('input#save-account-settings').attr('value',"Save");
					$('p.form-error').html('There was an error :/');
				}
			},
			error: function(data) {
				$('input#save-account-settings').attr('class',"btn");
				$('input#save-account-settings').attr('value',"Save");
			}
		});
	});

	// Create a new profile
	$('input#new-profile-submit').bind('click', function(event) {
		event.preventDefault();
		$(this).attr('class',"btn disabled");
		$(this).attr('value',"Saving...");
		$.ajax({
			type: 'POST',
			url: "/profiles",
			dataType: 'json',
			data: {profile: $('form#new-profile-form').serializeObject()},
			success: function(data) {
				if(data.profile) {
					$('input#new-profile-submit').attr('class',"btn");
					$('input#new-profile-submit').attr('value',"Save");
					$('div#new-profile').modal('hide');
					$('table#profiles-table tr:last').after(
						"<tr id=\"" + data.profile.id +
							"\"><td class=\"profile-name\">" +
							data.profile.name +
							"</td><td class=\"profile-email\">" +
							data.profile.email +
							"</td><td class=\"profile-subs\">" +
							data.profile.subscriptions +
							"</td><td class=\"profile-state\">" +
							data.profile.state +
							"</td></tr>"
					);
				} else if (data.error) {
					$('input#new-profile-submit').attr('class',"btn");
					$('input#new-profile-submit').attr('value',"Save");
					$('p.form-error').html(data.error);
				} else {
					$('input#new-profile-submit').attr('class',"btn");
					$('input#new-profile-submit').attr('value',"Save");
					$('p.form-error').html('There was an error :/');
				}
			},
			error: function(data) {
				$('p.form-error').html('There was an error :(');
				$('input#new-profile-submit').attr('class',"btn");
				$('input#new-profile-submit').attr('value',"Save");
			}
		});
	});


	// Edit profile
	$('input#edit-profile-submit').bind('click', function(event) {
		event.preventDefault();
		$(this).attr('class',"btn disabled");
		$(this).attr('value',"Saving...");
		$.ajax({
			type: 'PUT',
			url: "/profiles/" + $('input#edit-profile-id').attr('value'),
			dataType: 'json',
			data: {profile: $('form#edit-profile-form').serializeObject()},
			success: function(data) {
				if(data.profile) {
					$('input#edit-profile-submit').attr('class',"btn");
					$('input#edit-profile-submit').attr('value',"Save");
					$('div#edit-profile').modal('hide');
					$('tr#' + $('input#edit-profile-id').attr('value')).html(
							"<td class=\"profile-name\">" +
							data.profile.name +
							"</td><td class=\"profile-email\">" +
							data.profile.email +
							"</td><td class=\"profile-subs\">" +
							data.profile.subscriptions +
							"</td><td class=\"profile-state\">" +
							data.profile.state +
							"</td>"
					);
				} else if (data.error) {
					$('input#edit-profile-submit').attr('class',"btn");
					$('input#edit-profile-submit').attr('value',"Save");
					$('p.form-error').html(data.error);
				} else {
					$('input#edit-profile-submit').attr('class',"btn");
					$('input#edit-profile-submit').attr('value',"Save");
					$('p.form-error').html('There was an error :/');
				}
			},
			error: function(data) {
				$('p.form-error').html('There was an error :(');
				$('input#new-profile-submit').attr('class',"btn");
				$('input#new-profile-submit').attr('value',"Save");
			}
		});
	});

	// Create a new plan
	$('input#new-plan-submit').bind('click', function(event) {
		event.preventDefault();
		$(this).attr('class',"btn disabled");
		$(this).attr('value',"Saving...");
		$.ajax({
			type: 'POST',
			url: "/plans",
			dataType: 'json',
			data: {plan: $('form#new-plan-form').serializeObject()},
			success: function(data) {
				if(data.plan) {
					$('input#new-plan-submit').attr('class',"btn");
					$('input#new-plan-submit').attr('value',"Save");
					$('div#new-plan').modal('hide');
					$('ul.dropdown-menu').prepend(
						"<li><a href=\"\">" + data.plan.name + "</a></li>"
					);
					$('div#share-plan').modal('show');
					if(document.location.hostname == 'localhost') // XXX bleh
						var url = "http://" + document.location.hostname + ':' + document.location.port + data.plan.url;
					else
						var url = "http://" + document.location.hostname + data.plan.url;
					$('span#plan-url-value').html(
						"<a target=\"_blank\" href=\"" + url + "\">" + url + "</a>"
					);
				} else if (data.error) {
					$('input#new-plan-submit').attr('class',"btn");
					$('input#new-plan-submit').attr('value',"Save");
					$('p.form-error').html(data.error);
				} else {
					$('input#new-plan-submit').attr('class',"btn");
					$('input#new-plan-submit').attr('value',"Save");
					$('p.form-error').html('There was an error :/');
				}
			},
			error: function(data) {
				$('p.form-error').html('There was an error :(');
				$('input#new-plan-submit').attr('class',"btn");
				$('input#new-plan-submit').attr('value',"Save");
			}
		});
	});


});

// Google Charting API

// Load the Visualization API and the piechart package.
google.load('visualization', '1.0', {'packages':['corechart']});

google.setOnLoadCallback(drawVisualization);

// Set a callback to run when the Google Visualization API is loaded.
function drawVisualization() {
  // Some raw data (not necessarily accurate)
  var data = google.visualization.arrayToDataTable([
    ['Month',   'Basic Membership', 'Long-Term Membership'],
    ['Jan',    165,      938],
    ['Feb',    135,      1120],
    ['Mar',    157,      1167],
    ['Apr',    139,      1110],
    ['May',    136,      691],
    ['Jun',    136,      691],
    ['Jul',    136,      691],
    ['Aug',    136,      691],
    ['Sep',    136,      691],
    ['Oct',    136,      691],
    ['Nov',    136,      691],
    ['Dec',    136,      691]
  ]);

  // Create and draw the visualization.
  var ac = new google.visualization.AreaChart(document.getElementById('revenue'));
  ac.draw(data, {
    title : 'Your Revenue',
    isStacked: true,
    width: '100%',
    height: 400,
		backgroundColor: 'transparent',
    vAxis: {title: "Revenue ($)"}
  });
}
