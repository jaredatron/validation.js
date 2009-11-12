Object.extend(Form.Element.Validators, (function() {
  
  function isBlank(value, complete){
    if (!value.blank()) this.addError('must be blank');
    complete();
  };
  
  function isNotBlank(value, complete){
      if (value.blank()) this.addError('cannot be blank');
      complete();
    };
    
  function isChecked(checked, complete){
    if (!checked) this.addError('must be checked');
    complete();
  };
  
  function isNotChecked(checked, complete){
    if (!!checked) this.addError('cannot be checked');
    complete();
  };

  var EMAIL_ADDRESS_REGEX = /^([A-Za-z0-9]{1,}([-_\.&'][A-Za-z0-9]{1,}){0,}){1,}@(([A-Za-z0-9]{1,}[-]{0,1})\.){1,}[A-Za-z]{2,6}$/;
  function isAnEmailAddress(value, complete){
    if (!EMAIL_ADDRESS_REGEX.test(value))
      this.addError('must be a valid email address');
    complete();
  };
  
  
  return {
    'is blank'            : isBlank,
    'is not blank'        : isNotBlank,
    'is checked'          : isChecked,
    'is not checked'      : isNotChecked,
    'is an email address' : isAnEmailAddress
  };
  
  
})());

Object.extend(Form.Validators, (function() {

  function passwordsMatch(values, complete){
    if (values.password != values.password_confirmation) this.addError('passwords do not match');
    complete();
  }
  
  return {
    'passwords match': passwordsMatch
  };
  
})());