// Welcome to the Coral javascript kingdom of doom!
// Haiku pending.


// Configuration and statics

// Utility funcs

function toggleSubmit(el) {
	if($(el).attr('class') == 'btn' && $(el).attr('value') == 'Save') {
		$(el).attr('class','btn disabled');
		$(el).attr('value','Saving...');
	} else {
		this.$('#settings-submit').attr('class',"btn");
		this.$('#settings-submit').attr('value',"Save");
	}
};

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
