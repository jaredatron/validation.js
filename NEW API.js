// 


$(element)
  .validates('no_blank')
  .validates('isEmailAddress')
  .validates(function isNotBobAtYahooDotCom(value){
    var element = this;
    if (input.value == 'bob@yahoo.com')
      new Form.ValidationError(this, 'cannot be bob@yahoo.com');
  });

$(element).validity_is_cachable = true;
// set this to false if the validity of this element is
// for some reason not cachable. I.E. its based on changing data
// like the time or something
// this really just means isValid() is going to run all the
// validators each time it's called.

$(element).isValid();
// returns boolean
// (caches )

$(element).validate();
// returns element
 
$(element).validationErrors();
// returns an Array of validation errors, if any

$(element).validationErrors().fullMessages();
// returns an String explaining the validation errors, if any

$(element).validationErrors().first().toString();
// returns an String explaining the validation error
 
$(element).observe('validation:true', function(){ });
$(element).observe('validation:false', function(){ });

'<input validations="is_not_blank contains_only_numbers"></input>';
//validations can be defined inline


// the reasons we are extracting the display of validation into
// another step is so that you can validate form fields without
// changing their appearance. Most forms fields are "invalid"
// when the page loads and we want to be able to validate the
// entire form without the whole thing showing invalid. if you
// want to remove this just run:
// $(form).displaysValidationStateOnValidation();

$(element).displayValidationState();
// sets the valid attribute to true|false
// and then fires the 'validation:display_state' event
// (this is where you should hook in any display code)
// and returns the element

$(element).observe('validation:display_state', function(event){
  var element = event.element();
  element.addClassName(element.isValid() ? 'valid' : 'invalid');
});

$(element).setsValidAttributeOnLabelElement();
$(element).doesntClearValidAttributeOnChange();
// 

$(form).validatesOnSubmit();
$(form).elements.validatesOnChange();
$(form).elements.validatesOnBlur();

$(form).elements.displaysValidation....


$(form).validationErrors();
// returns an Array of validation errors, if any, for the form and all of it's elements


$(form).enabledElements();
$(form).disabledElements();
$(form).validElements();
$(form).invalidElements();


$(form).validationErrors().on('email_address')
// -> array of errors for the email address element

