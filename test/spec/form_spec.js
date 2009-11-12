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
      form.validates(function(value, complete){
        this.addError('must not suck');
        complete();
      });
    
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
            validation_errors = validation.errors;
          }
        });
      });
      waits(1);
      runs(function(){
        expect(validation_errors.on(form)[0]).toEqual('must not suck');
        expect(validation_errors.on(form.password)[0]).toEqual('must not be a crappy password');
        expect(validation_errors.on(form.password_confirmation)[0]).toEqual('must not be a copy of a crappy password');
      });
    });
    
    it('should fire events for the form as well as it\'s elements', function(){
      
    });
    
  });
  
});
