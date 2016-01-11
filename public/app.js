(function(){
    "use strict";
    
    angular.module('app',[])
    .controller('AppCtrl',AppCtrl);
    
    AppCtrl.$inject = ['$scope'];
    
    
    function AppCtrl ($scope) {
        var socket = io.connect();
        $scope.lights = [];
        $scope.lightToggle = lightToggle;
        $scope.motionToggle = motionToggle;
	    $scope.motionOn = true;
	    socket.on('connect',function() {
		    socket.emit('light status');
        });
        socket.on('light status', function (lights) {
            console.log(lights);
            $scope.lights = lights;
            $scope.$apply();
        });
	    socket.on('motion set', function (value) {
		    $scope.motionOn = value;
            $scope.$apply();
	    });
        function lightToggle(n) {
            socket.emit('light change', n);
        }
	    function motionToggle() {
		    socket.emit('motion set', $scope.motionOn);
	    }
        
    }
    
    
})();
