describe('Form.Element.Validators',function(){

  var element;

  beforeEach(function(){
    element = new Element('input');
  });

  function createValidatorTests(o){
    describe('.'+o.validator, function(){

      if (o.beforeEach) beforeEach(o.beforeEach)

      beforeEach(function(){
        element.validates(o.validator);
      });


      it('should error when the value '+o.bad_value_description,function(){
        var conclusion, error_message;
        runs(function(){
          element.setValue(o.bad_value).validate(function(is_valid, element){
            conclusion = is_valid;
            error_message = element.validationErrors().fullMessages().first();
          });
        });
        waits(1);
        runs(function(){
          expect(conclusion).toEqual(false);
          expect(error_message).toEqual(o.error_message);
        });
      });


      it('should not error when the value '+o.good_value_description,function(){
        var conclusion, error_messages_size;
        runs(function(){
          element.setValue(o.good_value).validate(function(is_valid, element){
            conclusion = is_valid;
            error_messages_size = element.validationErrors().size();
          });
        });
        waits(1);
        runs(function(){
          expect(conclusion).toEqual(true);
          expect(error_messages_size).toEqual(0);
        });
      });

    });
  }

  createValidatorTests({
    validator: 'isBlank',
    bad_value: 'something',
    bad_value_description: 'is not blank',
    error_message: 'INPUT must be blank',
    good_value: '',
    good_value_description: 'is blank',
  });

  createValidatorTests({
    validator: 'isNotBlank',
    bad_value: '',
    bad_value_description: 'is blank',
    error_message: 'INPUT cannot be blank',
    good_value: 'something',
    good_value_description: 'is not blank',
  });

  createValidatorTests({
    beforeEach: function() {
      element.type = "checkbox";
    },
    validator: 'isChecked',
    bad_value: false,
    bad_value_description: 'is not checked',
    error_message: 'INPUT must be checked',
    good_value: true,
    good_value_description: 'is checked',
  });


  createValidatorTests({
    beforeEach: function() {
      element.type = "checkbox";
    },
    validator: 'isNotChecked',
    bad_value: true,
    bad_value_description: 'is checked',
    error_message: 'INPUT cannot be checked',
    good_value: false,
    good_value_description: 'is not checked',
  });

  createValidatorTests({
    validator: 'isEmailAddress',
    bad_value: 'asdsadsad asd sadas',
    bad_value_description: 'is not a valid email address',
    error_message: 'INPUT must be a valid email address',
    good_value: 'person@example.com',
    good_value_description: 'is a valid email address',
  });

});