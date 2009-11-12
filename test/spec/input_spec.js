describe('Input', function () {

  var input;
  beforeEach(function () {
    input = new Element('input');
  });

  describe('#validate', function(){
    
    it('should pass an array of errors to onInvalid', function(){
      input.validates(function addingErrors(value, complete){
        this.addError('error 1');
        this.addError('error 2');
        this.addError('error 3');
        this.addError('error 4');
        complete();
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
    
  });
  
});