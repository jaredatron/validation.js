describe('Form#',function(){
  var form, input;
  
  beforeEach(function(){
    form = document.body.down('form');
    input = form.getActiveElements().first();
    form.validationErrors().clear();
  });

  describe('validators',function(){
    it('should return an array',function(){
      expect(Object.isArray(form.validators())).toEqual(true);
    });
  });
  
  describe('validates',function(){
    it('should accept a function and push it onto the validators array',function(){
      function something(){}
      form.validates(something);
      expect(form.validators()).toContain(something);
    });
    
    it('should accept a string name of a function in Form.Element.Validations',function(){
      Form.Element.Validators.livesOnTheMoon = function(){};
      form.validates('livesOnTheMoon');
      expect(form.validators()).toContain(Form.Element.Validators.livesOnTheMoon);
      delete Form.Element.Validators.livesOnTheMoon;
    })
  });
  
  
  
  describe('.validationErrors()', function () {

    it('should be an instance of Form.Element.ValidationErrors',function(){
      expect(form.validationErrors() instanceof Form.ValidationErrors).toEqual(true);
    });

    describe('.clear',function(){
      it('should remove all errors from the form and its child elements',function(){
        expect(form.validationErrors().size()).toEqual(0);
        form.validationErrors().add('new form error');
        expect(form.validationErrors().size()).toEqual(1);
        input.validationErrors().add('new form error');
        expect(input.validationErrors().size()).toEqual(1);
        expect(form.validationErrors().size()).toEqual(2);
        form.validationErrors().clear();
        expect(form.validationErrors().size()).toEqual(0);
      });
    });

    describe('.toArray',function(){
      it('should return an array of arrays like: [element, error]', function(){
        form.validationErrors().add('form is broken');
        input.validationErrors().add('input is broken');
        form.validationErrors().toArray().each(function(error){
          expect(
            (error[0] === form  && error[1] == 'form is broken' ) ||
            (error[0] === input && error[1] == 'input is broken')
          ).toEqual(true);
        });
      });
    });

    describe('.add',function(){
      it('should push a new error on to the stack',function(){
        form.validationErrors().add('new form error');
        var form_contains_new_error = form.validationErrors().toArray().any(function(error){
          return error[0] == form && error[1] == "new form error";
        });
        expect(form_contains_new_error).toEqual(true);
      });
    });



    it('should inherit all child element validation errors',function(){
      input.validationErrors().add('broken');
      var form_contains_child_error = form.validationErrors().toArray().any(function(error){
        return error[1] == "broken";
      });
      expect(form_contains_child_error).toEqual(true);
    });

    describe('.on',function(){
      it('should return the validation errors for the given element name',function(){
        expect(form.validationErrors().on(input.name)).toEqual(input.validationErrors());
      });

      it('should return the validation errors for the given element',function(){
        expect(form.validationErrors().on(input)).toEqual(input.validationErrors());
      });
    });


  });
})