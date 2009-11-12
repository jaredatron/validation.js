describe('Form',function(){
  var form, password, password_confirmation;

  beforeEach(function(){
    form = new Element('form');
    password = new Element('input');
    password.type = "password";
    password.name = "password";
    password_confirmation = new Element('input');
    password_confirmation.type = "password";
    password_confirmation.name = "password_confirmation";
    form.appendChild(password);
    form.appendChild(password_confirmation);
  });
  
  describe('#validators', function(){
    it('should return an array', function(){
      expect(form.validators()).toBeAnInstanceOf(Array);
    });
  });

  describe('#validates', function(){

    it('should take a function and push it onto the stack of validators', function(){
      form.validates(function(){});
      expect(form.validators().length).toEqual(1);
    });

    it('should take a name of a global validator and push it onto the stack of validators', function(){
      form.validates('passwords match');
      expect(form.validators().length).toEqual(1);
    });

    it('should raise an error when given anything other then a function or a string', function(){
      var exception;
      try{ form.validates(); }catch(e){ exception = e; }
      expect(exception.toString()).toEqual('Error: validator must be a function or a name of validator');

      exception = undefined;
      try{ form.validates('bad name'); }catch(e){ exception = e; }
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
      var first_validator, second_validator, third_validator, fourth_validator;
      form
        .validates(function firstValidator(value, complete){
          first_validator = true;
          complete();
        })
        .validates(function secondValidator(value, complete){
          second_validator = true;
          complete();
        });
      
      form.password
        .validates(function thirdValidator(value, complete){
          third_validator = true;
          complete();
        });
        
      form.password_confirmation
        .validates(function fourthValidator(value, complete){
          fourth_validator = true;
          complete();
        });

      runs(function(){
        first_validator = second_validator = third_validator = fourth_validator = false;
        form.validate();
      });
      waits(1);
      runs(function(){
        expect(first_validator).toEqual(true);
        expect(second_validator).toEqual(true);
        expect(third_validator).toEqual(true);
        expect(fourth_validator).toEqual(true);
      });
    });
    
    it('should collect errors for the form and it\'s active elements', function(){
      form.validates(function(value, complete){
        this.addError('must not suck');
        complete();
      })
    
      form.password.validates(function(value, complete){
        this.addError('must not be a crappy password');
        complete();
      });
      
      form.password_confirmation.validates(function(value, complete){
        this.addError('must not be a copy of a crappy password');
        complete();
      });
      
      var validation_errors;
      runs(function(){
        form.validate({
          onComplete: function(validation){
            validation_errors = validation.errors();
          },
        });
      });
      waits(1);
      runs(function(){
        expect(validation_errors.on(form)[0]).toEqual('must not suck');
        expect(validation_errors.on(form.password)[0]).toEqual('must not be a crappy password');
        expect(validation_errors.on(form.password_confirmation)[0]).toEqual('must not be a copy of a crappy password');
      });
    })
    
  });
  
});
