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

    var validators = element.retrieve('_validators', []);
    if (!validators.include(validator)) validators.push(validator);
    return element;
  }


  Object.extend(Form.Element.Methods,{
    validators: function(element){
      return element.retrieve('_validators', []);
    },
    validates: validates.curry(Form.Element.Validators),
    validate: function(element, options){
      new FormElementValidation(element, options).run();
      return element;
    }
  });


  function FormElementValidationErrors(element, errors){
    this.element = element;
    return Object.extend(errors || [], this);
  }
  FormElementValidationErrors.prototype = {
    fullMessages: function(){
      var name;
      if (this.element) name = this.element.name || this.element.id || this.element.nodeName;
      return this.map(function(error){
        return name ? name+' '+error : error;
      }).compact().uniq();
    }
  };


  var FormElementValidation = Class.create({
    timeout:    10, // seconds
    onValid:    Prototype.emptyFunction,
    onInvalid:  Prototype.emptyFunction,
    onTimeout:  Prototype.emptyFunction,
    onComplete: Prototype.emptyFunction,
    initialize: function(element, options) {
      var self = this;
      self.UUID = new Date().getTime();

      Object.extend(self,options);
      self.is_complete = false;
      self.timedout = false;
      self.errors = new FormElementValidationErrors(element);
      self.element = $(element);
    },
    collectValidators: function(){
      this.validators = this.element.retrieve('_validators', []).clone();
      return this;
    },
    value: function(){
      this._value || (this._value = this.element.getValue());
      return this._value;
    },
    run: function(){
      var self = this;
      self.collectValidators();
      if (!self.validators.length) return self.complete();

      self.set_timeout_id = setTimeout(function(){ // timeout handler
        self.timedout = true;
        self.complete();
      }, self.timeout * 1000);

      self.validators.clone().each(function(validator){
        validator(self.value(), function reportErrors(errors){ self.reportErrors(validator, errors); });
      });
    },
    reportErrors: function(validator, errors){
      var self = this;
      if (self.is_complete) throw new Error('validator attempted to report errors after validation completed');
      if (!self.validators.include(validator)) throw new Error('validator attempted to report errors twice');

      self.addErrors(errors);
      self.validators = self.validators.without(validator);
      if (!self.validators.length) self.complete();
    },

    addErrors: function(errors){
      Array.prototype.push.apply(this.errors, errors);
      return this;
    },
    hasErrors: function(){
      return !!this.errors.length;
    },

    isValid: function(){
      return !this.hasErrors();
    },

    complete: function(){
      clearTimeout(this.set_timeout_id);
      if (this.is_complete) throw new Error('complete called twice, WTF');
      this.is_complete = true;
      this.validators.length ?
        this.completeTimedout() :
        this.isValid() ?
          this.completeSuccessfully() :
          this.completeUnsuccessfully();

      this.onComplete(this, this.element);
      this.fire('complete');
      return this;
    },
    completeSuccessfully: function(){
      this.onValid(this, this.element);
      this.fire('success');
      return this;
    },
    completeUnsuccessfully: function(){
      this.onInvalid(this, this.errors, this.element);
      this.fire('failure');
      return this;
    },
    completeTimedout: function(){
      this.onTimeout(this, this.validators, this.element);
      this.fire('timeout');
      return this;
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


  Object.extend(Form.Methods,{
    getActiveElements: function(form){
      return $(form).getElements().findAll(function(element){
        return (element.style.display !== 'none' && element.style.visibility !== 'hidden' && element.disabled !== true);
      });
    },
    validators: Form.Element.Methods.validators,
    validates:  validates.curry(Form.Validators),
    validate: function(element, options){
      new FormValidation(element, options).run();
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
    },
    fullMessages: function(){
      return this.map(function(record){
        var element = record[0], error = record[1];
        if (element.nodeName == 'FORM') element = undefined;
        var full_messages = new FormElementValidationErrors(element, error).fullMessages();
        return full_messages.length ? full_messages : undefined;
      }).compact().uniq();
    }
  };

  var FormValidation = Class.create(FormElementValidation, {
    initialize: function($super, element, options) {
      var self = this;
      $super(element, options);
      self.errors = new FormValidationErrors();
      self.errors.push([self.element,[]]);
    },
    value: function(){
      this._value || (this._value = {});
      return this._value;
    },
    collectValidators: function(){
      var self = this;
      self.elements = self.element.getActiveElements();
      self.validators = self.element.retrieve('_validators', []).clone();

      self.elements.each(function(element){
        // store the values of each element into a hash that's passed to form validators
        self.value()[element.name] = element.getValue();
        self.errors.push([element, []]);

        // create a form validator for that validates each child element
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

      return this;
    },

    event_prefix:'form:validation',
    addErrors: function(errors){
      this.addErrorsOn(this.element, errors);
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
      return this.errors.any(function(record){ return record[1].length; });
    }
  });


  Element.addMethods();

})();