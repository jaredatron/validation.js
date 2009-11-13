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
    debug:      false,
    onValid:    Prototype.emptyFunction,
    onInvalid:  Prototype.emptyFunction,
    onTimeout:  Prototype.emptyFunction,
    onComplete: Prototype.emptyFunction,
    initialize: function(element, options) {
      var self = this;
      self.UUID = new Date().getTime();

      if (Object.isFunction(options)) options = {onComplete:options};
      Object.extend(self,options);
      self.is_complete = false;
      self.timedout = false;
      self.errors = new FormElementValidationErrors(element);
      self.element = $(element);

      self.log('validator spawned');
      self.fire('start');
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
      if (!self.validators.length){
        self.log('completeing because no validators found');
        self.complete();
        return;
      }

      self.set_timeout_id = setTimeout(function(){ // timeout handler
        self.log('timeout handler fired');
        self.timedout = true;
        self.complete();
      }, self.timeout * 1000);

      self.validators.clone().each(function(validator){
        validator(self.value(), function reportErrors(errors){ self.reportErrors(validator, errors); });
      });
    },

    log: function(){
      if (this.debug)
        console.info.apply(console,[this.UUID,'->'].concat($A(arguments)).concat([this]));
      return this;
    },

    reportErrors: function(validator, errors){
      var self = this;
      if (self.is_complete) throw new Error('validator attempted to report errors after validation completed');
      if (!self.validators.include(validator)) throw new Error('validator attempted to report errors twice');


      errors || (errors = []);
      self.log('reporting errors for',validator, errors);
      self.addErrors(errors);
      // self.log('removing validator',validator,'from',self.UUID,'from', ('element' in validator ? validator.element : ''));
      self.validators = self.validators.without(validator);
      if (!self.validators.length){
        self.log('completing as intended');
        self.complete();
      }
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
      this.fire('finish');
      return this;
    },
    completeSuccessfully: function(){
      this.log('completeing successfully');
      this.onValid(this, this.element);
      this.fire('success');
      return this;
    },
    completeUnsuccessfully: function(){
      this.log('completeing unsuccessfully');
      this.onInvalid(this, this.errors, this.element);
      this.fire('failure');
      return this;
    },
    completeTimedout: function(){
      this.log('timing out');
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

        // create a form validator that validates the child element
        var elementIsValid = function elementIsValid(values, reportErrors){
          element.validate({
            UUID: self.UUID+'-child-'+(new Date().getTime()),
            debug: self.debug,
            timeout: self.timeout - 0.1,
            onValid: function(){
              reportErrors();
            },
            onInvalid: function(validation){
              self.addErrorsOn(validation.element, validation.errors);
              reportErrors();
            },
            onTimeout: function(validation, validators){
              elementIsValid.element = validation.element;
              elementIsValid.validation = validation;
              elementIsValid.validators = validators;
            }
          });
        };
        self.validators.push(elementIsValid);
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