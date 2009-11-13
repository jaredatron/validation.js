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
    
    
    
    describe('should fire validation events', function(){
      var report_errors, is_valid,
          validation_start_fired,
          validation_finish_fired,
          validation_success_fired,
          validation_failure_fired,
          validation_timeout_fired;

      beforeEach(function(){
        validation_start_fired = validation_finish_fired = validation_success_fired =
        validation_failure_fired = validation_timeout_fired = 0;
        
        input
          .validates(function depends(value, reportErrors){
            if (!report_errors) return;
            if (!is_valid)
              reportErrors(['is invalid']);
            else
              reportErrors();
          })
          .observe('validation:start', function(event){
            validation_start_fired++;
          })
          .observe('validation:finish', function(event){
            validation_finish_fired++;
          })
          .observe('validation:success', function(event){
            validation_success_fired++;
          })
          .observe('validation:failure', function(event){
            validation_failure_fired++;
          })
          .observe('validation:timeout', function(event){
            validation_timeout_fired++;
          });
      });


      it('should fire start,finsh and failure when validation fails', function(){
        runs(function(){
          report_errors = true;
          is_valid = false;
          input.validate();
        });
        waits(1);
        runs(function(){
          expect(validation_start_fired  ).toEqual(1);
          expect(validation_finish_fired ).toEqual(1);
          expect(validation_success_fired).toEqual(0);
          expect(validation_failure_fired).toEqual(1);
          expect(validation_timeout_fired).toEqual(0);
        });
      });

      it('should fire start,finsh and success when validation succeeds', function(){
        runs(function(){
          report_errors = true;
          is_valid = true;
          input.validate();
        });
        waits(1);
        runs(function(){
          expect(validation_start_fired  ).toEqual(1);
          expect(validation_finish_fired ).toEqual(1);
          expect(validation_success_fired).toEqual(1);
          expect(validation_failure_fired).toEqual(0);
          expect(validation_timeout_fired).toEqual(0);
        });
        waits(1);
      });
      
      it('should fire start,finsh and timedout when validation timesout', function(){
        runs(function(){
          report_errors = false;
          input.validate({timeout: 0.1});
        });
        waits(110);
        runs(function(){
          expect(validation_start_fired  ).toEqual(1);
          expect(validation_finish_fired ).toEqual(1);
          expect(validation_success_fired).toEqual(0);
          expect(validation_failure_fired).toEqual(0);
          expect(validation_timeout_fired).toEqual(1);
        });
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