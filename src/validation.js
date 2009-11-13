(function() {
  
  Form.Validators = {};
  Form.Element.Validators = {};
  function validates(validators, element, validator){
    if (Object.isString(validator)){
      if (validator in validators){
        validator = validators[validator];
      }else{
        throw new TypeError('unable to find validator named "'+validator+'"', validators);
      }
    }

    if (!Object.isFunction(validator))
      throw new Error('validator must be a function or a name of validator');
    
      
    element.retrieve('_validators', []).push(validator);
    return element;
  }


  Object.extend(Form.Element.Methods,{
    validators: function(element){
      return element.retrieve('_validators', []);
    },
    validates: validates.curry(Form.Element.Validators),
    validate: function(element, options){
      new FormElementValidation(element, options);
      return element;
    }
  });
  
  
  var Validation = Class.create({
    timeout:    10, // seconds
    onValid:    Prototype.emptyFunction,
    onInvalid:  Prototype.emptyFunction,
    onTimeout:  Prototype.emptyFunction,
    onComplete: Prototype.emptyFunction,
    initialize: function(element, options) {
      var self = this;
      
      self.UUID = new Date().getTime();
      Object.extend(self,options);
      self.complete = false;
      self.timedout = false;
      self.element = element = $(element);
      self.validators = element.retrieve('_validators', []).clone();
      self.run();
    },
    setupTimeoutHandler: function(){
      var self = this;
      (function(){ // timeout handler
        if (!self.validators.length) return;
        self.complete = true;
        self.timedout = true;
        self.onTimeout(self, self.validators, self.element);
        self.onComplete(self, self.element);
        self.fire('timeout');
      }).delay(self.timeout);
    },
    validatorComplete: function(validator){
      var self = this;
      if (self.complete) throw new Error('validator called complete after validation completed');
      if (!self.validators.include(validator)) throw new Error('validator called complete twice');

      self.validators = self.validators.without(validator);
      if (!self.validators.length) self.completeValidation();
    },
    
    completeValidation: function(validator){
      return this.hasErrors() ? this.validationFailure() : this.validationSuccess();
    },
    validationSuccess: function(){
      this.onValid(this, this.element);
      this.onComplete(this, this.element);
      this.fire('success');
      this.fire('complete');
      return this;
    },
    validationFailure: function(){
      this.onInvalid(this, this.errors, this.element);
      this.onComplete(this, this.element);
      this.fire('failure');
      this.fire('complete');
      return this;
    },
    isValid: function(){
      return !this.hasErrors();
    },
    event_prefix:'validation',
    fire: function(event){
      this.element.fire(this.event_prefix+':'+event,{
        validation: this,
        element:this.element
      });
      return this;
    }
  });
  
  
  var FormElementValidation = Class.create(Validation, {
    run: function() {
      var self = this;

      if (!self.validators.length) return self.validationSuccess();

      self.errors = [];
      self.value = self.element.getValue();
      
      self.validators.each(function(validator){
        validator.call(self, self.value, self.validatorComplete.bind(self).curry(validator));
      });
      
      self.setupTimeoutHandler();
    },
    addError: function(error){
      this.errors.push(error);
      return this;
    },
    hasErrors: function(){
      return !!this.errors.length;
    }
  });
  
  
  Object.extend(Form.Methods,{
    getActiveElements: function(form){
      return $(form).getElements().findAll(function(element){
        return (element.style.display !== 'none' && element.style.visibility !== 'hidden' && element.disabled !== true);
      });
    },
    validators: Form.Element.Methods.validators,
    validates:  validates.curry(Form.Validators),
    validate: function(element, options){
      new FormValidation(element, options);
      return element;
    }
  });
  
  
  function FormValidationErrors(){
    return Object.extend([], this);
  }
  FormValidationErrors.prototype = {
    on: function(element){
      var record = this.find(function(record){ return record[0] === element; });
      if (record) return record[1];
    }
  };
  
  var FormValidation = Class.create(Validation, {
    run: function() {
      var self = this;
      
      self.elements = self.element.getActiveElements();

      if (!self.validators.length && !self.elements.length) return self.validationSuccess();
      
      self.errors = new FormValidationErrors;
      self.errors.push([self.element,[]]);
      
      self.values = {};
      // store the values of each element and create a form validator
      // for the validation of each child element
      self.elements.each(function(element){
        self.values[element.name] = element.getValue();
        self.errors.push([element, []]);
        
        self.validators.push(function elementIsValid(values, complete){
          element.validate({
            UUID: self.UUID+'-child',
            timeout: self.timeout,
            onComplete: function(validation){
              self.addErrorsOn(element, validation.errors);
              complete();
            }
          });
        });
      });
      
      self.validators.each(function(validator){
        validator.call(self, self.values, self.validatorComplete.bind(self).curry(validator));
      });
      
      self.setupTimeoutHandler();
    },
    event_prefix:'form:validation',
    addError: function(error){
      this.errors.on(this.element).push(error);
      return this;
    },
    addErrorOn: function(element, error){
      this.errors.on(element).push(error);
      return this;
    },
    addErrorsOn: function(element, errors){
      Array.prototype.push.apply(this.errors.on(element), errors);
      return this;
    },
    hasErrors: function(){
      return this.errors.pluck(1).pluck('length').any();
    }
  });
  
  
  Element.addMethods();
  
})();