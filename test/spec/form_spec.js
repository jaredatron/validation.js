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


  describe('#validate', function(){

    it('should collect errors for the form and it\'s active elements', function(){
      form.validates(function(value, reportErrors){
        reportErrors(['must not suck']);
      });

      form.password.validates(function(value, reportErrors){
        reportErrors(['must not be a crappy password']);
      });

      form.password_confirmation.validates(function(value, reportErrors){
        reportErrors(['must not be a copy of a crappy password']);
      });

      var validation_errors;
      runs(function(){
        form.validate({
          UUID: 'PETER',
          debug: true,
          onComplete: function(validation){
            validation_errors = validation.errors;
          }
        });
      });
      waits(100);
      runs(function(){
        console.dir(validation_errors);
        expect(validation_errors.on(form)[0]).toEqual('must not suck');
        expect(validation_errors.on(form.password)[0]).toEqual('must not be a crappy password');
        expect(validation_errors.on(form.password_confirmation)[0]).toEqual('must not be a copy of a crappy password');
      });
    });

    it('should fire events for the form as well as it\'s elements', function(){
      var form_validation_failure_event_fired, form_validation_success_event_fired,
          element_validation_failure_event_fired, element_validation_success_event_fired;

      form
        .observe('form:validation:failure', function(event){
          form_validation_failure_event_fired++;
        })
        .observe('form:validation:success', function(event){
          form_validation_success_event_fired++;
        });

      form.password
        .observe('validation:failure', function(event){
          element_validation_failure_event_fired++;
        })
        .observe('validation:success', function(event){
          element_validation_success_event_fired++;
        });

      runs(function(){
        form_validation_failure_event_fired = form_validation_success_event_fired =
        element_validation_failure_event_fired = element_validation_success_event_fired = 0;
        form.validate();
      });
      waits(1);
      runs(function(){
        expect(form_validation_failure_event_fired).toEqual(0);
        expect(form_validation_success_event_fired).toEqual(1);
        expect(element_validation_failure_event_fired).toEqual(0);
        expect(element_validation_success_event_fired).toEqual(1);
      });
    });

    it('should send the validators and elements that timed out to the onTimeout handler', function(){
      function brokenValidator(){}
      function bustedValidator(){}

      form
        .validates(brokenValidator)
        .validates(function(value, reportErrors){ reportErrors(); })
        .validates(bustedValidator);

      form.password
        .validates(brokenValidator)
        .validates(function(value, reportErrors){ reportErrors(); })
        .validates(bustedValidator);

      var timedout_validators;
      runs(function(){
        form.validate({
          timeout: 0.1,
          onTimeout: function(validation, validators){
            timedout_validators = validators;
          }
        });
      });
      waits(110);
      runs(function(){
        expect(timedout_validators[0]).toEqual(brokenValidator);
        expect(timedout_validators[1]).toEqual(bustedValidator);
        expect(timedout_validators[2].validators[0]).toEqual(brokenValidator);
        expect(timedout_validators[2].validators[1]).toEqual(bustedValidator);
      });
    });

  });

});
