(function() {

  this.toBeAnInstanceOf = function (expected) {
    return this.report((this.actual instanceof expected),
        'Expected ' + this.actual + ' to be an instance of ' + expected + '.');
  };

}).apply(jasmine.Matchers.prototype);