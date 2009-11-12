describe('FormElement', function () {

  var input;
  beforeEach(function () {
    input = new Element('input');
  });

  describe('#validators', function(){
    it('should return an array', function(){
      expect(input.validators()).toBeAnInstanceOf(Array);
    });
  });

  describe('#validates', function(){

    it('should take a function and push it onto the stack of validators', function(){
      input.validates(function(){});
      expect(input.validators().length).toEqual(1);
    });

    it('should take a name of a global validator and push it onto the stack of validators', function(){
      input.validates('is blank');
      expect(input.validators().length).toEqual(1);
    });

    it('should raise an error when given anything other then a function or a string', function(){
      var exception;
      try{ input.validates(); }catch(e){ exception = e; }
      expect(exception.toString()).toEqual('Error: validator must be a function or a name of validator');

      exception = undefined;
      try{ input.validates('bad name'); }catch(e){ exception = e; }
      expect(exception.toString()).toEqual('TypeError: unable to find validator named "bad name"');
    });

  });

  describe('#validate', function(){
    var on_valid_called, on_invalid_called, on_timeout_called, on_complete_called;
    var validate_watchers = {
      timeout: 0.1, // second
      onValid:    function(){ on_valid_called    = true; },
      onInvalid:  function(){ on_invalid_called  = true; },
      onTimeout:  function(){ on_timeout_called  = true; },
      onComplete: function(){ on_complete_called = true; }
    };
    beforeEach(function () {
      on_valid_called = on_invalid_called = on_timeout_called = on_complete_called = false;
    });


    it('should run each validator', function(){
      var first_validator, second_validator;
      input
        .validates(function firstValidator(value, complete){
          first_validator = true;
          complete();
        })
        .validates(function secondValidator(value, complete){
          second_validator = true;
          complete();
        });

      runs(function(){
        input.validate();
      });
      waits(1);
      runs(function(){
        expect(first_validator).toEqual(true);
        expect(second_validator).toEqual(true);
      });
    });

    it('should timeout if a validator doesn\'t call complete', function(){
      input.validates(function brokenValidator(){});

      runs(function(){
        input.validate(validate_watchers);
      });
      waits(110);
      runs(function(){
        expect(on_valid_called).toEqual(false);
        expect(on_invalid_called).toEqual(false);
        expect(on_timeout_called).toEqual(true);
        expect(on_complete_called).toEqual(true);
      });
    });
    
    it('should send the validators that timed out to the onTimeout handler', function(){
      function brokenValidator(){}
      function bustedValidator(){}
      input
        .validates(brokenValidator)
        .validates(function(value, complete){ complete(); })
        .validates(bustedValidator);

      var timedout_validators;
      runs(function(){
        input.validate({
          timeout: 0.1,
          onTimeout: function(validation, validators){
            timedout_validators = validators
          }
        });
      });
      waits(110);
      runs(function(){
        expect(timedout_validators[0]).toEqual(brokenValidator);
        expect(timedout_validators[1]).toEqual(bustedValidator);
      });
    });

    it('should call onValid is there are no validators', function(){
      runs(function(){
        input.validate(validate_watchers);
      });
      waits(1);
      runs(function(){
        expect(on_valid_called).toEqual(true);
        expect(on_invalid_called).toEqual(false);
        expect(on_timeout_called).toEqual(false);
        expect(on_complete_called).toEqual(true);
      });
    });

    it('should pass and array of errors to onInvalid', function(){
      input.validates(function isNotBlank(value, complete){
        if (!value || value == '') this.addError('cannot be blank');
        complete();
      });
      var input_errors;
      runs(function(){
        input.validate({
          onInvalid: function(validator, errors, input){
            on_invalid_called = true;
            input_errors = errors;
          }
        });
      });
      waits(1);
      runs(function(){
        expect(on_invalid_called).toEqual(true);
        expect(input_errors).toBeAnInstanceOf(Array);
        expect(input_errors[0]).toEqual('cannot be blank');
      });
    });
    
    it('should not call callbacks until all validations have completed', function(){
      validate_watchers.timeout = 0.5; //second

      input.validates(function slowValidator(value, complete){
        complete.delay(0.2);
      });

      runs(function(){
        input.validate(validate_watchers);
      });
      waits(1);
      runs(function(){
        expect(on_complete_called).toEqual(false);
      });
      waits(100);
      runs(function(){
        expect(on_complete_called).toEqual(false);
      });
      waits(500);
      runs(function(){
        expect(on_complete_called).toEqual(true);
      });
    });
    
    it('should fire validation events', function(){
      var validation_failure_fired, validation_success_fired;
      input
        .validates('is not blank')
        .observe('validation:failure', function(event){
          validation_failure_fired = true;
        })
        .observe('validation:success', function(event){
          validation_success_fired = true;
        });
      
      runs(function(){
        validation_failure_fired = validation_success_fired = false;
        input.setValue('');
        input.validate();
      });
      waits(1);
      runs(function(){
        expect(validation_failure_fired).toEqual(true);
        expect(validation_success_fired).toEqual(false);
      });
      
      runs(function(){
        validation_failure_fired = validation_success_fired = false;
        input.setValue('not blank');
        input.validate();
      });
      waits(1);
      runs(function(){
        expect(validation_failure_fired).toEqual(false);
        expect(validation_success_fired).toEqual(true);
      });
      
    });
    
    describe('\'s complete handler', function(){

      it('should raise an error if a validator calls complete twice', function(){
        var exception;
        input.validates(function callsCompleteTwice(value, complete){
          try{
            complete(); complete();
          }catch(e){
            exception = e.toString();
          }
        });

        runs(function(){
          input.validate();
        });
        waits(1);
        runs(function(){
          expect(exception).toEqual('Error: validator called complete twice');
        });
      });

      it('should raise an error if a validator calls after validation has completed', function(){
        var exception;
        input.validates(function callsCompleteTwice(value, complete){
          try{
            complete(); complete();
          }catch(e){
            exception = e.toString();
          }
        });

        runs(function(){
          input.validate();
        });
        waits(1);
        runs(function(){
          expect(exception).toEqual('Error: validator called complete twice');
        });
      });

    });
    
  });
  


});