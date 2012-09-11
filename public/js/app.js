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

// Backbone event aggregator
