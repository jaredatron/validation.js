describe('FormElement', function () {
  var form_element;

  beforeEach(function () {
    form_element = new Element('input');
  });

  describe('#validates',function(){
    it('should accept a function and push it onto the validators array',function(){
      function something(){}
      form_element.validates(something);
      expect(form_element.retrieve('_validators', [])).toContain(something);
    });

    it('should accept a string name of a function in Form.Element.Validations',function(){
      Form.Element.Validators.livesOnTheMoon = function(){};
      form_element.validates('livesOnTheMoon');
      expect(form_element.retrieve('_validators', [])).toContain(Form.Element.Validators.livesOnTheMoon);
      delete Form.Element.Validators.livesOnTheMoon;
    });
  });

  describe('#isValid',function(){
    it('should execute all the validation methods and return the collected value',function(){

      var is_one_run_count = 0;
      form_element.validates(function isOne(value){
        is_one_run_count++;
        if (value != "1") this.validationErrors().add('value must be 1');
      });

      var is_not_two_run_count = 0;
      form_element.validates(function isNotTwo(value){
        is_not_two_run_count++;
        if (value == "2") this.validationErrors().add('value must not be 2');
      });

      expect(is_one_run_count).toEqual(0);
      expect(is_not_two_run_count).toEqual(0);

      form_element.setValue(2);
      expect(form_element.isValid()).toEqual(false);
      expect(is_one_run_count).toEqual(1);
      expect(is_not_two_run_count).toEqual(1);

      form_element.setValue(1);
      expect(form_element.isValid()).toEqual(true);
      expect(is_one_run_count).toEqual(2);
      expect(is_not_two_run_count).toEqual(2);
    });
  });

  describe('#validationErrors()', function () {

    it('should be an instance of Form.Element.ValidationErrors',function(){
      expect(form_element.validationErrors()).toBeAnInstanceOf(Form.Element.ValidationErrors);
    });

    describe('.clear',function(){
      it('should remove all errors from the form and its child elements',function(){
        expect(form_element.validationErrors().size()).toEqual(0);
        form_element.validationErrors().add('new form error');
        expect(form_element.validationErrors().size()).toEqual(1);
        form_element.validationErrors().clear();
        expect(form_element.validationErrors().size()).toEqual(0);
      });
    });

    describe('.toArray',function(){
      it('should return an array of error messages', function(){
        form_element.validationErrors().add('form element is broken');
        form_element.validationErrors().add('form element is broken even more');
        form_element.validationErrors().toArray().each(function(error){
          expect(
            error == 'form element is broken' ||
            error == 'form element is broken even more'
          ).toEqual(true);
        });
      });
    });

    describe('.add',function(){
      it('should push a new error on to the stack',function(){
        form_element.validationErrors().add('new form error');
        var form_element_contains_new_error = form_element.validationErrors().toArray().any(function(error){
          return error == "new form error";
        });
        expect(form_element_contains_new_error).toEqual(true);
      });
    });


    describe('.fullMessages',function(){
      it('should display human readable error messages',function(){
        form_element.name = 'first_name';
        form_element.validates(function(){
          this.validationErrors().add('cannot be blank');
        });

        expect( form_element.validate().validationErrors().fullMessages().first() ).toEqual('first name cannot be blank');
      });

      it('should join each error message when toString is called on the collection',function(){
        form_element.name = "steve_jobs";
        form_element.validates(function picky(){
          this.validationErrors().add('cannot be wrong');
          this.validationErrors().add('cannot be right');
        });

        var error_messages = form_element.validate().validationErrors().fullMessages().toString();
        expect(
          error_messages == 'steve jobs cannot be wrong, steve jobs cannot be right' ||
          error_messages == 'steve jobs cannot be right, steve jobs cannot be wrong'
        ).toBeTruthy();
      });
    });

  });

  it('should fire validation events when validated',function(){
    var success_observer_called = failure_observer_called = false;
    form_element
      .validates('isBlank')
      .observe('form:element:validation:success', function(){
        success_observer_called = true;
      })
      .observe('form:element:validation:failure', function(){
        failure_observer_called = true;
      });

    expect(form_element.isValid()).toBe(true);
    expect(success_observer_called).toBe(true);
    expect(failure_observer_called).toBe(false);

    form_element.setValue('not blank');
    success_observer_called = failure_observer_called = false;
    expect(form_element.isValid()).toBe(false);
    expect(success_observer_called).toBe(false);
    expect(failure_observer_called).toBe(true);
  });
});