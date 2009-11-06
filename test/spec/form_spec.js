describe('Form',function(){
  var form, input;

  beforeEach(function(){
    form = $('a_form');
    input = $('an_input');
  });

  afterEach(function(){
    form.validationErrors().clear();
    form.validators.length = 0;
    form.getElements().each(function(element){
      element.validators().length = 0;
    });
  });

  describe('#validators',function(){
    it('should return an array',function(){
      expect(Object.isArray(form.validators())).toEqual(true);
    });
  });

  describe('#validates',function(){
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
    });
  });

  describe('#isValid',function(){

    it('should return true when there are no validators and no elements',function(){
      var form = new Element('form');
      expect(form.isValid()).toEqual(true);
    });

    it('should execute all it\'s and it\'s children\'s validation methods and return the collected value',function(){


      var input_values_dont_match_run_count = 0;
      form.validates(function inputValuesDontMatch(elements){
        input_values_dont_match_run_count++;
        if (this.an_input.getValue() == this.a_second_input.getValue()){
          this.validationErrors().add('input values must not match');
        }
      });

      var contains_only_letters_run_count = 0;
      function containsOnLetters(value){
        contains_only_letters_run_count++;
        if (!value.match(/^[a-z]+$/i)){
          this.validationErrors().add('input values must contain only letters');
        }
      }
      form.an_input.validates(containsOnLetters);
      form.a_second_input.validates(containsOnLetters);

      form.an_input.setValue('123');
      form.a_second_input.setValue('456');

      expect(input_values_dont_match_run_count).toEqual(0);
      expect(contains_only_letters_run_count).toEqual(0);

      expect(form.isValid()).toEqual(false);
      expect(input_values_dont_match_run_count).toEqual(1);
      expect(contains_only_letters_run_count).toEqual(2);
      expect(form.validationErrors().size()).toEqual(2);


      form.an_input.setValue('888');
      form.a_second_input.setValue('888');

      expect(form.isValid()).toEqual(false);
      expect(input_values_dont_match_run_count).toEqual(2);
      expect(contains_only_letters_run_count).toEqual(4);
      expect(form.validationErrors().size()).toEqual(3);


      form.an_input.setValue('abc');
      form.a_second_input.setValue('abc');

      expect(form.isValid()).toEqual(false);
      expect(input_values_dont_match_run_count).toEqual(3);
      expect(contains_only_letters_run_count).toEqual(6);
      expect(form.validationErrors().size()).toEqual(1);


      form.an_input.setValue('bob');
      form.a_second_input.setValue('sam');

      expect(form.isValid()).toEqual(true);
      expect(input_values_dont_match_run_count).toEqual(4);
      expect(contains_only_letters_run_count).toEqual(8);
      expect(form.validationErrors().size()).toEqual(0);

      // cleanup
      form.validators().length = 0;
      form.an_input.validators().length = 0;
      form.a_second_input.validators().length = 0;
      form.an_input.setValue('');
      form.a_second_input.setValue('');
    });

    it('should only take enabled form elements into account when validating',function(){
      expect(form.isValid()).toEqual(true);

      input.validates(function alwaysInvalid(){
        this.validationErrors().add('I\'ll never be valid muhahaha');
      });

      input.disabled = false;
      expect(form.isValid()).toEqual(false);
      expect(form.validationErrors().toArray()[0].element).toEqual(input);
      expect(form.validationErrors().toArray()[0].message).toEqual('I\'ll never be valid muhahaha');

      input.disabled = true;
      expect(form.isValid()).toEqual(true);

      //cleanup
      input.disabled = false;
      input.validators.length = 0;
    });

    it('should only take visible form elements into account when validating',function(){
      expect(form.isValid()).toEqual(true);
      expect(input.show().visible()).toEqual(true);

      input.validates(function alwaysInvalid(){
        this.validationErrors().add('I\'ll never be valid muhahaha');
      });

      expect(form.isValid()).toEqual(false);
      expect(form.validationErrors().toArray()[0].element).toEqual(input);
      expect(form.validationErrors().toArray()[0].message).toEqual('I\'ll never be valid muhahaha');

      input.hide();
      expect(form.isValid()).toEqual(true);

      //cleanup
      input.show();
      input.validators.length = 0;
    });
  });



  describe('#validationErrors()', function () {

    it('should be an instance of Form.Element.ValidationErrors',function(){
      expect(form.validationErrors()).toBeAnInstanceOf(Form.ValidationErrors);
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
            (error.element === form  && error.message == 'form is broken' ) ||
            (error.element === input && error.message == 'input is broken')
          ).toEqual(true);
        });
      });
    });

    describe('.add',function(){
      it('should push a new error on to the stack',function(){
        form.validationErrors().add('new form error');
        var form_contains_new_error = form.validationErrors().toArray().any(function(error){
          return error.element == form && error.message == "new form error";
        });
        expect(form_contains_new_error).toEqual(true);
      });
    });



    it('should inherit all child element validation errors',function(){
      input.validationErrors().add('broken');
      var form_contains_child_error = form.validationErrors().toArray().any(function(error){
        return error.message == "broken";
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

    describe('.fullMessages',function(){
      it('should display human readable error messages',function(){
        input.validates(function(){
          this.validationErrors().add('cannot be blank');
        });
        expect( form.validate().validationErrors().fullMessages().first() ).toEqual('an input cannot be blank');
      });
    });

  });
});