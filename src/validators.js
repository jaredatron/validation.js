Object.extend(Form.Element.Validators, (function() {
  
  function isBlank(value, reportErrors){
    if (!value.blank())
      reportErrors(['must be blank']);
    else
      reportErrors();
  };
  
  function isNotBlank(value, reportErrors){
      if (value.blank())
        reportErrors(['cannot be blank']);
      else
        reportErrors();
    };
    
  function isChecked(checked, reportErrors){
    if (!checked)
      reportErrors(['must be checked']);
    else
      reportErrors();
  };
  
  function isNotChecked(checked, reportErrors){
    if (!!checked)
      reportErrors(['cannot be checked']);
    else
      reportErrors();
  };

  var EMAIL_ADDRESS_REGEX = /^([A-Za-z0-9]{1,}([-_\.&'][A-Za-z0-9]{1,}){0,}){1,}@(([A-Za-z0-9]{1,}[-]{0,1})\.){1,}[A-Za-z]{2,6}$/;
  function isAnEmailAddress(value, reportErrors){
    if (!EMAIL_ADDRESS_REGEX.test(value))
        reportErrors(['must be a valid email address']);
      else
        reportErrors();
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

  function passwordsMatch(values, reportErrors){
    if (values.password != values.password_confirmation)
      reportErrors(['passwords do not match']);
    else
      reportErrors();
  }
  
  return {
    'passwords match': passwordsMatch
  };
  
})());