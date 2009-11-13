describe('[identical specs]', function(){

// I needed a validator for forms and form elements that had the same name
Form.Element.Validators['example validator'] =
Form.Validators['example validator'] =
function exampleValidator(value, reportErrors){
  reportErrors();
};


['Form','Input'].each(function(type){

  describe(type, function(){

    var element;

    beforeEach(function(){
      element = new Element(type);
    });

    describe('#validators', function(){
      it('should return an array', function(){
        expect(element.validators()).toBeAnInstanceOf(Array);
      });
    });

    describe('#validates', function(){

      it('should take a function and push it onto the stack of validators', function(){
        element.validates(function(){});
        expect(element.validators().length).toEqual(1);
      });

      it('should take a name of a global validator and push it onto the stack of validators', function(){
        element.validates('example validator');
        expect(element.validators().length).toEqual(1);
      });

      it('should not add the same validator twice',function(){
        element.validates('example validator');
        expect(element.validators().length).toEqual(1);
        element.validates('example validator');
        expect(element.validators().length).toEqual(1);
      });

      it('should raise an error when given anything other then a function or a string', function(){
        var exception;
        try{ element.validates(); }catch(e){ exception = e; }
        expect(exception.toString()).toEqual('Error: validator must be a function or a name of validator');

        exception = undefined;
        try{ element.validates('bad name'); }catch(e){ exception = e; }
        expect(exception.toString()).toEqual('TypeError: unable to find validator named "bad name"');
      });

    });

    describe('#validate', function(){
      var on_valid_called, on_invalid_called, on_timeout_called, on_complete_called;
      var validate_watchers = {
        timeout: 0.1, // second
        onValid:    function(){ on_valid_called    = true; },
        onInvalid:  function(){ on_invalid_called  = true; },
        onTimeout:  function(){ on_timeout_called  = true; },
        onComplete: function(){ on_complete_called = true; }
      };
      beforeEach(function () {
        on_valid_called = on_invalid_called = on_timeout_called = on_complete_called = false;
      });

      it('should run each validator', function(){
        var first_validator, second_validator;
        element
          .validates(function firstValidator(value, reportErrors){
            first_validator = true;
            reportErrors();
          })
          .validates(function secondValidator(value, reportErrors){
            second_validator = true;
            reportErrors();
          });

        runs(function(){
          element.validate();
        });
        waits(1);
        runs(function(){
          expect(first_validator).toEqual(true);
          expect(second_validator).toEqual(true);
        });
      });

      it('should timeout if a validator doesn\'t call complete', function(){
        element.validates(function brokenValidator(){});

        runs(function(){
          element.validate(validate_watchers);
        });
        waits(110);
        runs(function(){
          expect(on_valid_called).toEqual(false);
          expect(on_invalid_called).toEqual(false);
          expect(on_timeout_called).toEqual(true);
          expect(on_complete_called).toEqual(true);
        });
      });

      it('should send the validators that timed out to the onTimeout handler', function(){
        function brokenValidator(){}
        function bustedValidator(){}
        element
          .validates(brokenValidator)
          .validates(function(value, reportErrors){ reportErrors(); })
          .validates(bustedValidator);

        var timedout_validators;
        runs(function(){
          element.validate({
            timeout: 0.5,
            onTimeout: function(validation, validators){
              timedout_validators = validators;
            }
          });
        });
        waits(510);
        runs(function(){
          expect(timedout_validators[0]).toEqual(brokenValidator);
          expect(timedout_validators[1]).toEqual(bustedValidator);
        });
      });

      it('should accept a function in place of an options hash as an onComplete handler',function(){
        var on_complete_run;
        function onComplete(){
          on_complete_run = true;
        }

        runs(function(){
          on_complete_run = false;
          element.validate(onComplete);
        });
        waits(1);
        runs(function(){
          expect(on_complete_run).toEqual(true);
        });
      });

      it('should call onValid if there are no validators', function(){
        runs(function(){
          element.validate(validate_watchers);
        });
        waits(1);
        runs(function(){
          expect(on_valid_called).toEqual(true);
          expect(on_invalid_called).toEqual(false);
          expect(on_timeout_called).toEqual(false);
          expect(on_complete_called).toEqual(true);
        });
      });

      it('should not call callbacks until all validations have completed', function(){
        validate_watchers.timeout = 0.5; //second

        element.validates(function slowValidator(value, complete){
          complete.delay(0.25);
        });

        runs(function(){
          element.validate(validate_watchers);
        });
        waits(1);
        runs(function(){
          expect(on_complete_called).toEqual(false);
        });
        waits(500);
        runs(function(){
          expect(on_complete_called).toEqual(true);
        });
      });



      describe('\'s complete handler', function(){

        it('should raise an error if a validator calls complete twice', function(){
          var exception;
          element
            .validates(function doesNothing(value, reportErrors){
              reportErrors();
            })
            .validates(function callsCompleteTwice(value, reportErrors){
              try{
                reportErrors(); reportErrors();
              }catch(e){
                exception = e.toString();
              }
            })
            .validates(function doesNothing(value, reportErrors){
              reportErrors();
            })

          runs(function(){
            element.validate();
          });
          waits(1);
          runs(function(){
            expect(exception).toEqual('Error: validator attempted to report errors twice');
          });
        });

        it('should raise an error if a validator calls after validation has completed', function(){
          var validation_complete, reportErrorsMethod, exception;
          element.validates(function callsCompleteTwice(value, reportErrors){
            reportErrorsMethod = reportErrors;
            reportErrors();
          });

          runs(function(){
            validation_complete = false;
            element.validate({
              onComplete: function(validation){
                validation_complete = validation.is_complete;
              }
            });
          });
          waits(100);
          runs(function(){
            expect(validation_complete).toEqual(true);
            try{
              reportErrorsMethod();
            }catch(e){
              exception = e.toString();
            }
            expect(exception).toEqual('Error: validator attempted to report errors after validation completed');
          });
        });

      });

    });

  });
});

});