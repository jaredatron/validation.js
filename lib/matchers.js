(function() {

  this.toBeAnInstanceOf = function (expected) {
    return this.report((this.actual instanceof expected),
        'Expected ' + expected + ' to be an instance of ' + this.actual + '.');
  };

}).apply(jasmine.Matchers.prototype);