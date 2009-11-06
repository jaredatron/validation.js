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

  describe('#validate',function(){
    it('should accept onComplete, onValid and onInvalid callbacks',function(){
      form_element.validates('isNotBlank');
      var is_valid, on_complete_called_with;
      var validation_callbacks = {
        onComplete: function onComplete(is_valid){
          on_complete_called_with = is_valid;
        },
        onValid: function onValid(){
          (function(){ is_valid = 'yes'; }).delay(0.1);
        },
        onInvalid: function onInvalid(){
          (function(){ is_valid = 'no'; }).delay(0.1);
        }
      };

      runs(function(){
        form_element.setValue('');
        is_valid = on_complete_called_with = null;
        form_element.validate(validation_callbacks);
      });
      waits(110);
      runs(function(){
        expect(is_valid).toEqual('no');
        expect(on_complete_called_with).toEqual(false);
      });

      runs(function(){
        form_element.setValue('not blank');
        is_valid = on_complete_called_with = null;
        form_element.validate(validation_callbacks);
      });
      waits(110);
      runs(function(){
        expect(is_valid).toEqual('yes');
        expect(on_complete_called_with).toEqual(true);
      });
    });

    it('should accept a single function as an onComplete callback',function(){
      form_element.validates('isNotBlank');
      var is_valid, on_complete_called_with;
      function onComplete(is_valid){
        on_complete_called_with = is_valid ? 'gtg' : 'bad';
      }

      runs(function(){
        form_element.setValue('');
        is_valid = on_complete_called_with = null;
        form_element.validate(onComplete);
      });
      waits(110);
      runs(function(){
        expect(on_complete_called_with).toEqual('bad');
      });

      runs(function(){
        form_element.setValue('not blank');
        is_valid = on_complete_called_with = null;
        form_element.validate(onComplete);
      });
      waits(110);
      runs(function(){
        expect(on_complete_called_with).toEqual('gtg');
      });
    });

    // it('should accept onValid and onInvalid callbacks as first and second arguments',function(){
    //   form_element.validates('isNotBlank');
    //   var is_valid, on_complete_run;
    //   function onComplete(){
    //     (function(){ on_complete_run++; }).delay(0.1);
    //   }
    //   function onValid(){
    //     (function(){ is_valid = 'yes'; }).delay(0.1);
    //   }
    //   function onInvalid(){
    //     (function(){ is_valid = 'no'; }).delay(0.1);
    //   };
    //
    //   runs(function(){
    //     form_element.setValue('');
    //     is_valid = null;
    //     on_complete_run = 0;
    //     form_element.validate(onComplete, onValid, onInvalid);
    //   });
    //   waits(110);
    //   runs(function(){
    //     expect(is_valid).toEqual('no');
    //     expect(on_complete_run).toEqual(1);
    //   });
    //
    //   runs(function(){
    //     form_element.setValue('not blank');
    //     is_valid = null;
    //     on_complete_run = 0;
    //     form_element.validate(onComplete, onValid, onInvalid);
    //   });
    //   waits(110);
    //   runs(function(){
    //     expect(is_valid).toEqual('yes');
    //     expect(on_complete_run).toEqual(1);
    //   });
    // });

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
    var success_observer_called, failure_observer_called;
    form_element
      .validates('isBlank')
      .observe('form:element:validation:success', function(){
        success_observer_called++;
      })
      .observe('form:element:validation:failure', function(){
        failure_observer_called++;
      });

    success_observer_called = failure_observer_called = 0;
    form_element.setValue('').validate();
    expect(success_observer_called).toBe(1);
    expect(failure_observer_called).toBe(0);

    success_observer_called = failure_observer_called = 0;
    form_element.setValue('not blank').validate();
    expect(success_observer_called).toBe(0);
    expect(failure_observer_called).toBe(1);
  });
});