describe('Form.Element.Validators',function(){
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
  
  describe('["passwords match"]', function(){
    it('should error if password and password_confirmation do not match', function(){
      form.validates('passwords match');
      
      var validation_result, validation_errors
      function collectResults(validation){
        validation_result = validation.isValid();
        validation_errors = validation.errors.on(form);
      }
      
      runs(function(){
        form.password.setValue('1amG0D');
        form.password_confirmation.setValue('1amG0D');
        form.validate({ onComplete: collectResults });
      })
      waits(1);
      runs(function(){
        expect(validation_result).toEqual(true);
        expect(validation_errors.length).toEqual(0);
      });
      
      runs(function(){
        form.password.setValue('1amG0D');
        form.password_confirmation.setValue('UrG0D');
        form.validate({ onComplete: collectResults });
      })
      waits(1);
      runs(function(){
        expect(validation_result).toEqual(false);
        expect(validation_errors.length).toEqual(1);
        expect(validation_errors.first()).toEqual('passwords do not match');
      });
    })
  })
  
});