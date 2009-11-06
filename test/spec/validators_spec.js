describe('Form.Element.Validators',function(){

  var input;

  beforeEach(function(){
    input = new Element('input');
  });

  describe('.isblank',function(){
    it('should error when the value is not blank',function(){
      input.validates('isBlank');

      input.setValue('');
      expect(input.isValid()).toEqual(true);

      input.setValue('something');
      expect(input.isValid()).toEqual(false);
      expect(input.validationErrors().fullMessages().first()).toEqual('INPUT must be blank');
    });
  });

  describe('.isNotBlank',function(){
    it('should error when the value is blank',function(){
      input.validates('isNotBlank');

      input.setValue('something');
      expect(input.isValid()).toEqual(true);

      input.setValue('');
      expect(input.isValid()).toEqual(false);
      expect(input.validationErrors().fullMessages().first()).toEqual('INPUT cannot be blank');
    });
  });

  describe('.isChecked',function(){
    it('should error when the checkbox is not checked',function(){
      input.type = "checkbox";
      input.validates('isChecked');

      input.checked = true;
      expect(input.isValid()).toEqual(true);

      input.checked = false;
      expect(input.isValid()).toEqual(false);
      expect(input.validationErrors().fullMessages().first()).toEqual('INPUT must be checked');
    });
  });

  describe('.isNotChecked',function(){
    it('should error when the checkbox is not checked',function(){
      input.type = "checkbox";
      input.validates('isNotChecked');

      input.checked = false;
      expect(input.isValid()).toEqual(true);

      input.checked = true;
      expect(input.isValid()).toEqual(false);
      expect(input.validationErrors().fullMessages().first()).toEqual('INPUT cannot be checked');
    });
  });

  describe('.isEmailAddress',function(){
    it('should error when the checkbox is not checked',function(){
      input.validates('isEmailAddress');

      input.setValue('person@example.com')
      expect(input.isValid()).toEqual(true);

      input.setValue('asdsadsad asd sadas')
      expect(input.isValid()).toEqual(false);
      expect(input.validationErrors().fullMessages().first()).toEqual('INPUT must be a valid email address');
    });
  });
});