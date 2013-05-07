
angular.module("hexmaze", []).directive('draggable', function () {
    return {
        link: function (scope, elm, attrs) {
            var options = scope.$eval(attrs.draggable); //allow options to be passed in
            elm.draggable(options);
        }
    };
});