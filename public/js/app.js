// Welcome to the Coral javascript kingdom of doom!
// Haiku pending.


// Configuration and statics
//

// Jquery extension funcs

jQuery.fn.toggleSubmit = function() {
	if(this.attr('class') == 'btn' && this.attr('value') == 'Save') {
		this.attr('class','btn disabled');
		this.attr('value','Saving...');
	} else {
		this.attr('class',"btn");
		this.attr('value',"Save");
	}
}

// Make form data nestable inside a jso
jQuery.fn.serializeObject = function() {
  var arrayData, objectData;
  arrayData = this.serializeArray();
  objectData = {};

  $.each(arrayData, function() {
    var value;

    if (this.value != null) {
      value = this.value;
    } else {
      value = '';
    }

    if (objectData[this.name] != null) {
      if (!objectData[this.name].push) {
        objectData[this.name] = [objectData[this.name]];
      }

      objectData[this.name].push(value);
    } else {
      objectData[this.name] = value;
    }
  });

  return objectData;
};

function format_cents(cents) {
	dollars = cents / 100; 
	return dollars.toFixed(2);
}

// Underscore settings

_.templateSettings = {
	interpolate: /\{\{(.+?)\}\}/g,
	evaluate: /\[\[(.+?)\]\]/g
}


// Balanced payments API settings

balancedUri = 'TEST-MP761XGxjonKUa4HBnXOMoGy';
balancedUsername = 'e9234bfacc5211e1bda6026ba7e239a9';
balanced.init('/v1/marketplaces/' + balancedUri);
