(function() {
  
  var validates = Form.Validators;
  
  validates['passwords match'] = function passwordMatch(values, complete){
    if (values.password != values.password_confirmation) this.addError('passwords do not match');
    complete();
  }
  
})();

(function() {
  
  var validates = Form.Element.Validators;
  
  validates['is blank'] = function isBlank(value, complete){
    if (!value.blank()) this.addError('must be blank');
    complete();
  };
  
  validates['is not blank'] = function isNotBlank(value, complete){
      if (value.blank()) this.addError('cannot be blank');
      complete();
    };
    
  validates['is checked'] = function isChecked(checked, complete){
    if (!checked) this.addError('must be checked');
    complete();
  };
  
  validates['is not checked'] = function isNotChecked(checked, complete){
    if (!!checked) this.addError('cannot be checked');
    complete();
  };

  Form.Element.Validators['is an email address'] = function isEmailAddress(value, complete){
    if (!EMAIL_ADDRESS_REGEX.test(value))
      this.addError('must be a valid email address');
    complete();
  };
  
  
})();