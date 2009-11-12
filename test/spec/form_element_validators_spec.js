describe('Form.Element.Validators',function(){

  var element;

  function createValidatorTests(o){
    describe('["'+o.validator+'"]', function(){

      if (o.beforeEach) beforeEach(o.beforeEach);

      beforeEach(function(){
        element = new Element('input');
        element.validates(o.validator);
      });


      it('should error when the value '+o.bad_value_description,function(){
        var conclusion, error_message;
        runs(function(){
          element
            .setValue(o.bad_value)
            .validate({
              onComplete: function(validation, element){
                conclusion = validation.isValid();
                error_message = validation.errors.first();
              }
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
          element
            .setValue(o.good_value)
            .validate({
              onComplete: function(validation, element){
                conclusion = validation.isValid();
              }
            });
            
        });
        waits(1);
        runs(function(){
          expect(conclusion).toEqual(true);
        });
      });

    });
  }

  createValidatorTests({
    validator: 'is blank',
    bad_value: 'something',
    bad_value_description: 'is not blank',
    error_message: 'must be blank',
    good_value: '',
    good_value_description: 'is blank'
  });

  createValidatorTests({
    validator: 'is not blank',
    bad_value: '',
    bad_value_description: 'is blank',
    error_message: 'cannot be blank',
    good_value: 'something',
    good_value_description: 'is not blank'
  });

  createValidatorTests({
    beforeEach: function() {
      element.type = "checkbox";
    },
    validator: 'is checked',
    bad_value: false,
    bad_value_description: 'is not checked',
    error_message: 'must be checked',
    good_value: true,
    good_value_description: 'is checked'
  });


  createValidatorTests({
    beforeEach: function() {
      element.type = "checkbox";
    },
    validator: 'is not checked',
    bad_value: true,
    bad_value_description: 'is checked',
    error_message: 'cannot be checked',
    good_value: false,
    good_value_description: 'is not checked'
  });

  createValidatorTests({
    validator: 'is an email address',
    bad_value: 'asdsadsad asd sadas',
    bad_value_description: 'is not a valid email address',
    error_message: 'must be a valid email address',
    good_value: 'person@example.com',
    good_value_description: 'is a valid email address'
  });

});