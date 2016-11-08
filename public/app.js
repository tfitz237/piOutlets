(function () {
    "use strict";
    var socket;
    angular.module('app', ['ngCookies']).controller('AppCtrl', AppCtrl);

    AppCtrl.$inject = ['$scope', '$http', '$cookies'];


    function AppCtrl ($scope, $http, $cookies) {
        $scope.loggedIn = false;
        $scope.loginFn = login;
        getCookie('jwt', function(value) {
                if(value !=null)
                    connect(value);
        });

        function connect(value) {
            console.log("trying to connect...");
            socket = io.connect('http://tomfitz.me:9999');
            socket.on('connect', function() {
                console.log('with token', value);
                socket.emit('authenticate', {token: value});
                socket.on('authenticated', connection);
                socket.on('unauthorized', function (msg) {
                    $scope.loggedIn = false;
                });
            });

        }


        function connection() {
            console.log("connected");
            $scope.loggedIn = true;
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
            $http.post("http://tomfitz.me:9999/login", {username: $scope.loginUsername, password: $scope.loginPassword})
                .success(function(data) {
                    if(data.valid) {
                        setCookie("jwt", data.token);
                        connect(data.token);
                    }
                    else
                        $scope.loggedIn = false;

                });
        }
        function getCookie(name, callback) {
            callback($cookies.get(name));
        }
        function setCookie(key,value) {
            $cookies.put(key,value);
        }
    }



})();
