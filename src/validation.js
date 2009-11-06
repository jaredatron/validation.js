(function(window) {
/* Validation.js v0.1 (2009)
 * writen by Jared Grippe, jared@rupture.com
 *
 *--------------------------------------------------------------------------*/


Form.Validation = {};

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
    var name = this.element.name || this.element.id;
    return this.map(function(error){
      return name+" "+error;
    });
  }
});

Form.ValidationErrors = Class.create(Form.Element.ValidationErrors,{
  toArray: function(){
    var form = this.element;
    var errors = this.errors.map(function(error){ return [form, error]; });
    form.getActiveElements().each(function(element){
      element.validationErrors().each(function(error){
        errors.push([element, error]);
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
    return this.map(function(error){
      return (error[0].name || error[0].id)+" "+error[1];
    });
  }
});


Object.extend(Form.Element.Methods,{
  /** FormElement#validators
    *
    * returns an array of the defined validators
    */
  validators: function validators(element){
    return element._validators || (element._validators = []);
  },

  /** FormElement#validates(validation | validation_name)
    *
    *
    */
  validates: function validates(element, validator){
    if (Object.isString(validator)){
      if (validator in Form.Element.Validators){
        validator = Form.Element.Validators[validator];
      }else{
        throw new TypeError('unable to find validator named "'+validator+'"');
      }
    }

    if (!Object.isFunction(validator))
      throw new Error('validator must be a function or a string');

    element.validators().push(validator);
    return element;
  },

  validate: function(element){
    element.validationErrors().clear();
    element.validators().invoke('call', element, element.getValue());
    return element;
  },

  isValid: function isValid(element){
    return element.validate().validationErrors().size() < 1;
  },

  validationErrors: function validationErrors(element){
    return element._validation_errors || (element._validation_errors = new Form.Element.ValidationErrors(element));
  },

});



Object.extend(Form.Methods,{
  getActiveElements: function(form){
    return $(form).getElements().findAll(function(element){
      return (element.style.display !== 'none' && element.style.visibility !== 'hidden' && element.disabled !== true);
    });
  },

  validators: Form.Element.Methods.validators,
  validates: Form.Element.Methods.validates,
  validate: function validate(form){
    form.validationErrors().clear();
    var elements = form.getActiveElements();
    elements.invoke('isValid');
    form.validators().invoke('call', form, elements);
    return form;
  },

  isValid: function isValid(form){
    return form.validate().validationErrors().size() < 1;
  },

  validationErrors: function validationErrors(form){
    return form._validation_errors || (form._validation_errors = new Form.ValidationErrors(form));
  },
});


Element.addMethods();




Form.Validators = {

};

Form.Element.Validators = {
  isblank: function isblank(input){
    if (input.value.blank()) return true;
    input.form.validationErrors().add(input,'must be blank');
  },
  notBlank: function notBlank(input){
    if (!input.value.blank()) return true;
    input.form.validationErrors().add(input,'cannot be blank');
  },

  isChecked: function isChecked(checkbox){
    if (checkbox.checked) return true;
    checkbox.form.validationErrors().add(checkbox,'must be checked');
  },
  isNotChecked: function isNotChecked(checkbox){
    if (!checkbox.checked) return true;
    checkbox.form.validationErrors().add(checkbox,'should no be checked');
  },

  isEmailAddress: function isEmailAddress(input){
    if (input.value.match(/^[^\s]+@[^\s]+\.\w\w+$/)) return true;
    input.form.validationErrors().add(input,'must be a valid email address');
  }
};



function return_true (){ return true;  }
function return_false(){ return false; }

})(this);