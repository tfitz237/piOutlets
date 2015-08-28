(function(){
    "use strict";
    
    angular.module('app',[])
    .controller('AppCtrl',AppCtrl);
    
    AppCtrl.$inject = ['$scope'];
    
    
    function AppCtrl ($scope) {
        var socket = io();
        $scope.lights = [];
        $scope.lightToggle = lightToggle;
        socket.on('connect',function(data) {
           
            
            
            
        });
        socket.on('light status', function (lights) {
            console.log(lights);
            $scope.lights = lights;
            $scope.$apply();
        });
        
        function lightToggle(n) {
            socket.emit('light change', n);
            
            
        }
        
        
    }
    
    
})();