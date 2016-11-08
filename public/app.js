(function () {
    "use strict";

    angular.module('app', ['ngCookies']).controller('AppCtrl', AppCtrl);

    AppCtrl.$inject = ['$scope', '$http', '$cookies'];


    function AppCtrl ($scope, $http, $cookies) {
        $scope.loggedIn = false;
        $scope.loginFn = login;
        if($cookies.get('jwt') != null) {
            var socket = io.connect('http://tomfitz.me:9999');
            socket.emit('authenticated', {token: $cookies.get('jwt')});
            socket.on('authenicated', connection);
            socket.on('unauthorized', function(msg) {
                $scope.loggedIn = false;
            });
        }



        function connection() {
            $scope.loggedIn = false;
            if (localStorage["jwt"] != null) {

            }
            $scope.lights = [];
            $scope.lightToggle = lightToggle;
            $scope.motionToggle = motionToggle;
            $scope.motionOn = true;
            socket.on('connect', function () {
                socket.emit('light status');

            });
            socket.on('light status', function (lights) {
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

            function speechToggle(light) {
                console.log(light);
                for (var i in $scope.lights) {
                    if (light.toLowerCase() == $scope.lights[i].name.toLowerCase()) {
                        socket.emit('light change', $scope.lights[i].id);
                    }

                }


            }
        }
        function login() {
            console.log("logginedin");
            $http.post("http://tomfitz.me:9999/loginext", {username: $scope.loginUsername, passwoord: $scope.loginPassword})
                .success(function(data) {
                    console.log(data);
                    if(data.valid) {
                        $cookies.put('jwt', data.token);
                        $scope.loggedIn = true;
                        var socket = io.connect('http://tomfitz.me:9999');
                        socket.emit('authenticated', {token: $cookies.get('jwt')});
                        socket.on('authenicated', connection);
                    }
                    else
                        $scope.loggedIn = false;

                });
        }

    }


})();
