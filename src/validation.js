(function() {
  
  Form.Validators = {};
  Form.Element.Validators = {};
  function validates(validators, element, validator){
    if (Object.isString(validator)){
      if (validator in validators){
        validator = validators[validator];
      }else{
        throw new TypeError('unable to find validator named "'+validator+'"');
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
      Object.extend(self,options);
      self.complete = false;
      self.timedout = false;
      self.element = element = $(element);
      self.validators = element.retrieve('_validators', []).clone();
      if (!self.validators.length){
        self.onValid(self, self.element);
        self.element.fire('validation:success',{element:self.element});
        self.onComplete(self, self.element);
        return;
      }
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
        self.element.fire('validation:timeout',{element:self.element});
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
      var self = this;
      // Validation complete
      if (self.hasErrors()){
        self.onInvalid(self, self.errors, self.element);
        self.onComplete(self, self.element);
        result = 'failure';
      }else{
        self.onValid(self, self.element);
        result = 'success';
      }
      self.onComplete(self, self.element);
      self.element.fire('validation:'+result,{element:self.element, errors:self.errors});
      self.element.fire('validation:complete',{element:self.element, errors:self.errors});
    }
  });
  
  
  var FormElementValidation = Class.create(Validation, {
    run: function() {
      var self = this;

      self.errors = [];
      self.value = self.element.getValue();
      
      self.validators.each(function(validator){
        validator.call(self, self.value, self.validatorComplete.bind(self).curry(validator));
      });
      
      self.setupTimeoutHandler();
      console.dir({FormElementValidation:self});
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
      
      self.errors = new FormValidationErrors;
      self.errors.push([self.element,[]]);
      
      self.values = {};
      self.elements = self.element.getActiveElements();
      self.elements.each(function(element){
        self.values[element.name] = element.getValue();
        self.errors.push([element, []]);
        element.validate({
          timeout: self.timeout,
          onComplete: function(validation, element){
            [].push.apply(self.errors.on(validation.element), validation.errors);
          }
        });
      });
      
      self.validators.each(function(validator){
        validator.call(self, self.values, self.validatorComplete.bind(self).curry(validator));
      });
      
      self.setupTimeoutHandler();
      console.dir({FormValidation:self});
    },
    addError: function(error){
      this.errors.on(this.element).push(error);
      return this;
    },
    hasErrors: function(){
      return this.errors.pluck(1).pluck('length').any();
    }
  });
  
  
  
  
  Element.addMethods();
  
})();