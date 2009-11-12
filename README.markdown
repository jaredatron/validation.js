# Validation.js

  Syntactically awesome form validation in Javascript

## Exmaples

    $(input)
      .validates('is not blank')
      .validates('is an email address')
      .validates(function accountDoesNotAlreadyExist(value, complete){
        var validation = this;
        new Ajax.Request('username_available?username='+value,{
          onComplete: function(){
            complete();
          },
          onFailure: function(response) {
            validation.addError('is already taken');
          }
        });
      })
      .observe('validation:failure',function(event){
        $(input).addClassName('invalid');
      })
      .observe('validation:success',function(event){
        $(input).removeClassName('invalid');
      });
      
    $(input).validate();