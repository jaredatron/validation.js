describe('Input', function () {

  var input;
  beforeEach(function () {
    input = new Element('input');
  });

  describe('#validate', function(){

    it('should pass an array of errors to onInvalid', function(){
      input.validates(function addingErrors(value, reportErrors){
        reportErrors([
          'error 1',
          'error 2',
          'error 3',
          'error 4'
        ]);
      });
      var on_invalid_called, input_errors;
      runs(function(){
        input.validate({
          onInvalid: function(validator, errors, input){
            on_invalid_called = true;
            input_errors = errors;
          }
        });
      });
      waits(1);
      runs(function(){
        expect(on_invalid_called).toEqual(true);
        expect(input_errors).toBeAnInstanceOf(Array);
        expect(input_errors[0]).toEqual('error 1');
        expect(input_errors[1]).toEqual('error 2');
        expect(input_errors[2]).toEqual('error 3');
        expect(input_errors[3]).toEqual('error 4');
      });
    });

    it('should fire validation events', function(){
      var validation_failure_fired, validation_success_fired, is_valid;

      input
        .validates(function depends(value, reportErrors){
          if (!is_valid)
            reportErrors(['is invalid']);
          else
            reportErrors();
        })
        .observe('validation:failure', function(event){
          validation_failure_fired++;
        })
        .observe('validation:success', function(event){
          validation_success_fired++;
        });

      runs(function(){
        validation_failure_fired = validation_success_fired = 0;
        is_valid = false;
        input.validate();
      });
      waits(1);
      runs(function(){
        expect(validation_failure_fired).toEqual(1);
        expect(validation_success_fired).toEqual(0);
      });
      waits(1);
      runs(function(){
        validation_failure_fired = validation_success_fired = 0;
        is_valid = true;
        input.validate();
      });
      waits(1);
      runs(function(){
        expect(validation_failure_fired).toEqual(0);
        expect(validation_success_fired).toEqual(1);
      });
    });

    describe('fullMessages',function(){
      it('should create strings of each error message', function(){
        input.validates(function isBrown(value, reportErrors){
          reportErrors(['is brown']);
        });
        var validation_errors;
        runs(function(){
          input.validate({
            onComplete: function(validation){
              validation_errors = validation.errors;
            }
          });
        });
        waits(1);
        runs(function(){
          expect(validation_errors.fullMessages().first()).toEqual('INPUT is brown');
          input.id = "a_cow";
          expect(validation_errors.fullMessages().first()).toEqual('a_cow is brown');
          input.name = "a_tree";
          expect(validation_errors.fullMessages().first()).toEqual('a_tree is brown');
        });

      });
    });

  });

});