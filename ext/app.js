(function () {
    "use strict";
    var socket;
    angular.module('app', ['ngCookies']).controller('AppCtrl', AppCtrl);

    AppCtrl.$inject = ['$scope', '$http', '$cookies'];


    function AppCtrl ($scope, $http, $cookies) {
        var port = chrome.runtime.connect({name: "extConnection"});
        init();
        port.onMessage.addListener(function(msg){
            console.log(msg.event + ">> " +msg.value);
            var event = msg.event;
            var value = msg.value;
            switch(event) {
                case "connected":
                    connection();
                    break;
                case "light status":
                    setLights(value);
                    break;
                case "motion set":
                    setMotion(value);
                    break;

            }
        });
        function init() {
            $scope.loggedIn = false;
            $scope.motionOn = true;
            $scope.lights = [];
            $scope.loginFn = login;
            $scope.lightToggle = lightToggle;
            $scope.motionToggle = motionToggle;
        }
        function connect(token) {
            port.postMessage({event: 'connect', value: token});
        }
        function connection() {
            $scope.loggedIn = true;
            port.postMessage({event: 'light status'});
        }
        function lightToggle(value) {
            port.postMessage({event:'light change', value: value});
        }

        function motionToggle() {
            port.postMessage({event:'motion set', value: $scope.motionOn});
        }
        function login() {
            $http.post("http://tomfitz.me:9999/login", {username: $scope.loginUsername, password: $scope.loginPassword})
                .success(function(data) {
                    if(data.valid) {
                        setToken(data.token);
                        connect(data.token);
                    }
                    else
                        $scope.loggedIn = false;

                });
        }
        function setLights(value) {
            $scope.lights = value;
            $scope.$apply();
        }
        function setMotion(value) {
            $scope.motionOn = value;
            $scope.$apply();
        }
        function setToken(value) {
            chrome.storage.local.set({'jwt': value}, function() {});
        }
    }



})();
