(function(window) {
/* Validation.js v0.1 (2009)
 * writen by Jared Grippe, jared@jaredgrippe.com
 *
 *--------------------------------------------------------------------------*/


var ValidationError = function(element, message){
  this.element = element;
  this.message = message+'';
};
ValidationError.prototype = new String();
ValidationError.prototype.valueOf = ValidationError.prototype.toString = function toString(){
  return (this.element.name || this.element.id || this.element.nodeName).replace(/(_|-)+/g,' ')+' '+this.message;
};


Form.Element.ValidationErrors = Class.create(Enumerable,{
  initialize: function(element){
    this.element = $(element);
    this.errors = [];
  },
  toObject: function(){ return this.toArray(); },
  toArray:  function(){ return $A(this.errors); },
  _each: function(iterator) {
    this.errors.each(iterator);
    return this;
  },
  clear: function(){
    this.errors.length = 0;
    return this;
  },
  add: function(error){
    this.errors.push(error);
    return this;
  },
  fullMessages: function(){
    var element = this.element,
        full_messages = this.map(function(message){
      return new ValidationError(element, message).toString();
    });
    full_messages.toString = fullMessagesToString;
    return full_messages;
  }
});

Form.ValidationErrors = Class.create(Form.Element.ValidationErrors,{
  toArray: function(){
    var form = this.element;
    var errors = this.errors.map(function(message){ return new ValidationError(form, message); });
    form.getActiveElements().each(function(element){
      element.validationErrors().each(function(message){
        errors.push(new ValidationError(element, message));
      });
    });
    return errors;
  },
  _each: function(iterator) {
    var errors = this.toArray().concat();
    this.element.getActiveElements().each(function(element){
      errors.concat( element.validationErrors().toArray() );
    });
    errors._each(iterator);
    return this;
  },
  clear: function(){
    console.log('----- clearing form validation errors');
    // console.trace();
    this.errors.length = 0;
    this.element.getActiveElements().each(function(element){
      element.validationErrors().clear();
    });
    return this;
  },
  on: function(element_name){
    var element;
    element = Object.isElement(element_name) ? element_name :
      this.element.down('*[name="'+element_name+'"]');
    return Object.isElement(element) ? element.validationErrors() : false;
  },
  fullMessages: function(){
    var full_messages = this.invoke('toString');
    full_messages.toString = fullMessagesToString;
    return full_messages;
  }
});

function fullMessagesToString(){
  return this.join(', ');
}


function validates(Type, element, validator){
  if (Object.isString(validator)){
    if (validator in Type.Validators){
      validator = Type.Validators[validator];
    }else{
      throw new TypeError('unable to find validator named "'+validator+'"');
    }
  }

  if (!Object.isFunction(validator))
    throw new Error('validator must be a function or a string');

  element.addValidator(validator);
  return element;
}

// collects all validators bound to the current state/value of it's element
// so they can be called asyncronously.
function validatorsFor(element){
  if (element.nodeName === 'FORM'){ // TODO this optomize this later
    var validators = []; serialized_form = element.serialize(true);
    element.getActiveElements().each(function(form_element){
      [].push.apply(validators, validatorsFor(form_element));
    });
    element.retrieve('_validators', []).map(function(validator){
      validators.push(validator.bind(element).curry(serialized_form, element));
    });
    return validators;
  }else{
    return element.retrieve('_validators', []).map(function(validator){
      return validator.bind(element).curry(element.getValue(), element);
    });
  }
}

function callValidatorsFor(element, callbacks){
  var validators = validatorsFor(element), timedout = false;

  if (!validators.length){
    callbacks.onComplete(element);
    callbacks.onSuccess(element);
    return;
  }
  
  (function(){ // timeout handler
    if (!validators.length) return;
    timedout = true;
    callbacks.onComplete(element);
    callbacks.onTimeout(validators);
    console.warn('validators timed out for', element);
    throw new Error('validators timed out');
    // if (callback) callback(element);
  }).delay(10);

  validators.clone().each(function(validator){
    function validatorComplete(){
      if (timedout) return console.warn('validatorComplete called after timeout');

      validators = validators.without(validator);
      
      if (!validators.length){ // complete
        callbacks.onComplete(element);
        callbacks.onSuccess(element);
      }
    }
    validator(validatorComplete);
  });


}

function fireEventsFor(element, callbacks){
  callbacks || (callbacks = {});
  if (element.validationErrors().size() < 1){
    if (element.nodeName === 'FORM'){
      element.fire('form:validation:success', {element:element}, false);
    }else{
      element.fire('form:element:validation:success', {element:element}, false);
    }
    if ('onValid' in callbacks) callbacks.onValid(element);
    if ('onComplete' in callbacks) callbacks.onComplete(true, element);
  }else{
    if (element.nodeName === 'FORM'){
      element.fire('form:validation:failure', {element:element}, false);
    }else{
      element.fire('form:element:validation:failure', {element:element}, false);
    }
    if ('onInvalid' in callbacks) callbacks.onInvalid(element);
    if ('onComplete' in callbacks) callbacks.onComplete(false, element);
  }
}

Object.extend(Form.Element.Methods,{
  /** FormElement#validators
    *
    * returns an array of the defined validators
    */
  addValidator: function addValidator(element, validator){
    element.retrieve('_validators', []).push(validator);
    return element;
  },

  /** FormElement#validators
    *
    * returns a clone of the validators array
    */
  removeValidator: function removeValidators(element, validator){
    element.store('_validators', element.retrieve('_validators', []).without(validator));
    return element;
  },

  /** FormElement#validates(validation | validation_name)
    *
    *
    */
  validates: validates.curry(Form.Element),

  /** FormElement#validate({
    *   onComplete: function(){},
    *   onValid: function(){},
    *   onInvalid: function(){},
    *   onTimeout: function(){}
    * });
    *
    */
  validate: function(element, callbacks){
    if (Object.isFunction(callbacks)) callbacks = {onComplete:callbacks};
    element.validationErrors().clear();
    if (element.retrieve('_validation_in_progress')) throw new Error('Element validations running in tandum is not recommended!');
    element.store('_validation_in_progress', true);

    callValidatorsFor(element, {
      onComplete: function(){
        element.store('_validation_in_progress', false);
      },
      onSuccess: function(){
        fireEventsFor(element, callbacks);
      },
      onTimeout: function(validators){
        callbacks.onTimeout(element, validators);
      }
    });
    return element;
  },
  
  validationInProgress: function(element){
    return !!element.retrieve('_validation_in_progress');
  },

  validationErrors: function validationErrors(element){
    return element.retrieve('_validationErrors') || element.retrieve('_validationErrors', new Form.Element.ValidationErrors(element));
  }

});



Object.extend(Form.Methods,{
  getActiveElements: function(form){
    return $(form).getElements().findAll(function(element){
      return (element.style.display !== 'none' && element.style.visibility !== 'hidden' && element.disabled !== true);
    });
  },
  addValidator: Form.Element.Methods.addValidator,
  removeValidator: Form.Element.Methods.removeValidator,
  validates: validates.curry(Form),
  validate: Form.Element.Methods.validate,
  validationInProgress: Form.Element.Methods.validationInProgress,
  validationErrors: function validationErrors(form){
    return form.retrieve('_validationErrors') || form.retrieve('_validationErrors', new Form.ValidationErrors(form));
  }
});


Element.addMethods();


// found this after a few google searches, there's probably a better one
var EMAIL_ADDRESS_REGEX = /^([A-Za-z0-9]{1,}([-_\.&'][A-Za-z0-9]{1,}){0,}){1,}@(([A-Za-z0-9]{1,}[-]{0,1})\.){1,}[A-Za-z]{2,6}$/;

Form.Validators = {
  // Example
  // passwordsMatch: function passwordsMatch(elements){
  //   if(!this.password.getValue() == this.password_confirmation.getValue())
  //     this.validationErrors().add('passwords must match');
  // },
  

};


// TODO

remove validationErrors().add and pass in stop passing in a validationComplete method instead do this

function exampleAsyncValidator(value, validation){
  new Ajax.Request('username_available',{
    onComplete: function(){
      validation.complete();
    },
    onFailure: function(response) {
      validation.addError('is already taken');
    }
  });
}


Form.Element.Validators = {
  isBlank: function isBlank(value, element, validationComplete){
    if (!value.blank()) this.validationErrors().add('must be blank');
    validationComplete();
  },
  isNotBlank: function isNotBlank(value, element, validationComplete){
    if (value.blank()) this.validationErrors().add('cannot be blank');
    validationComplete();
  },
  isChecked: function isChecked(checked, element, validationComplete){
    if (!checked) this.validationErrors().add('must be checked');
    validationComplete();
  },
  isNotChecked: function isNotChecked(checked, element, validationComplete){
    if (!!checked) this.validationErrors().add('cannot be checked');
    validationComplete();
  },
  isEmailAddress: function isEmailAddress(value, element, validationComplete){
    if (!EMAIL_ADDRESS_REGEX.test(value))
      this.validationErrors().add('must be a valid email address');
    validationComplete();
  },
  exampleAsyncValidator: function exampleAsyncValidator(value, element, validationComplete){
    new Ajax.Request('username_available',{
      onComplete: function(){
        validationComplete();
      },
      onFailure: function(response) {
        element.validationErrors().add('is already taken');
      }
    });
  }
};

})(this);