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
        self.onComplete(self, self.element);
        return;
      }
      self.run();
    },
    errors: function(){
      return this._errors;
    }
  });
  
  
  var FormElementValidation = Class.create(Validation, {
    run: function() {
      var self = this;

      self._errors = [];
      self.value = self.element.getValue();
      
      self.validators.each(function(validator){
        function complete(){
          if (self.complete) throw new Error('validator called complete after validation completed');
          if (!self.validators.include(validator)) throw new Error('validator called complete twice');

          self.validators = self.validators.without(validator);
          if (self.validators.length) return;
          if (self.errors().length){
            self.onInvalid(self, self.errors(), self.element);
            self.element.fire('validation:failure',{element:self.element, errors:self.errors()});
          }else{
            self.onValid(self, self.element);
            self.element.fire('validation:success',{element:self.element});
          }
          self.onComplete(self, self.element);
        }
        validator.call(self, self.value, complete); // TODO consider not defering here!
      });
      
      (function(){ // timeout handler
        if (!self.validators.length) return;
        self.complete = true;
        self.timedout = true;
        self.onTimeout(self, self.validators, self.element);
        self.onComplete(self, self.element);
      }).delay(self.timeout);
      
      // console.dir({FormElementValidation:self});
    },
    addError: function(error){
      console.log('adding error for', this, error);
      this._errors.push(error);
      return this;
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
      return this.find(function(record){ return record[0] === element; })[1];
    }
  };
  
  
  var FormValidation = Class.create(Validation, {
    run: function() {
      var self = this;
      
      self._errors = new FormValidationErrors;
      // self._errors.push([element,[]]);
      
      self.elements = self.element.getActiveElements();
      self.elements.each(function(element){
        self.errors().push([element, []]);
        // element.validate({
        //   timeout: self.timeout,
        //   onComplete: function(validation, element){
        //     [].push.apply(self.errors().on(validation.element), validation.errors())
        //   }
        // });
        
        
        element.validators.each(function(validator){
          function complete(){
            if (self.complete) throw new Error('validator called complete after validation completed');
            if (!self.validators.include(validator)) throw new Error('validator called complete twice');

            self.validators = self.validators.without(validator);
            if (self.validators.length) return;
            if (self.errors().length){
              self.onInvalid(self, self.errors(), self.element);
              self.element.fire('validation:failure',{element:self.element, errors:self.errors()});
            }else{
              self.onValid(self, self.element);
              self.element.fire('validation:success',{element:self.element});
            }
            self.onComplete(self, self.element);
          }
          validator.call(self, self.value, complete); // TODO consider not defering here!
        });
        
        
        
      });
    },
    addError: function(element, error){
      this.errors().on(element).push(error);
      return this;
    }
  });
  
  
  
  
  Element.addMethods();
  
})();