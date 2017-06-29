"use strict()";
angular.module("myApp", ['ngRoute', 'directive.g+signin', 'ngMessages'])
    .config(['$routeProvider', '$locationProvider','$compileProvider', function($routeProvider, $locationProvider, $compileProvider) {
        $compileProvider.debugInfoEnabled(false); // Disable debug mode
        
        $locationProvider.html5Mode(true); // Remove # from url
		// Routes
        for(var path in window.routes) {
            $routeProvider.when(path, window.routes[path]);
        }   
    
        $routeProvider.otherwise({redirectTo: "/login"});
    }])
    .run(['$rootScope','SessionService','$location', function($rootScope,SessionService,$location) {
        $rootScope.$on("$locationChangeStart", function(event, next, current) {
            for(var i in window.routes) {
                if(next.indexOf(i) != -1) {
                    if(window.routes[i].requireLogin && !SessionService.getUserAuthenticated()) {
                        swal("You need to be authenticated to see this page. Please login!");
                        event.preventDefault();
                        $location.path("/login");
                    }
                }
            }
        });   
    }])     
    .controller("MainCtrl", ['$scope', "$rootScope", function($scope, $rootScope) {
        $rootScope.employees = JSON.parse(localStorage.getItem("employeesList")) || [];

    }])
    .controller("adminCtrl", [ '$scope', '$location', 'SessionService', '$rootScope', '$q' , function($scope, $location, SessionService, $rootScope, $q) {
        var Promise = $q.resolve($rootScope.employees);
        $scope.employeeRecords = Promise.$$state.value;

        // var dataPromise = localStorage.getItem('employeesList');
        // dataPromise.then(function(data) {
        //     console.log("Data is ", data);
        //     $scope.employeeRecords = data;
        // })
        
        $scope.logout = function() {
            SessionService.setUserAuthenticated(true);
            localStorage.removeItem('status');   
            $rootScope.loggedIn = false; 
            $location.path("/login");
        };
        $scope.deleteEmployee = function(employee) {
            swal({
              title: "Are you sure?",
              text: "You will not be able to retrieve again!",
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: "Yes, delete it!",
              closeOnConfirm: false
            },
            function(){
              $rootScope.employees.splice($rootScope.employees.indexOf(employee), 1);
              localStorage.setItem("employeesList", JSON.stringify($rootScope.employees));
              $scope.$apply();
              swal("Deleted!", "Employee deleted", "success");
            });
        }
        $scope.isEditView = false; // Set employee edit view to false
        $scope.editEmployee = function(employee) {    
            $scope.isEditView = true;
            $scope.employeeDetail = employee;
            $scope.editIndex = $rootScope.employees.indexOf(employee);
        };
        $scope.saveEmployee = function() {
            $rootScope.employees[$scope.editIndex] = $scope.employeeDetail;
            localStorage.setItem("employeesList", JSON.stringify($rootScope.employees));
            swal("Employee details saved!");
            $scope.isEditView = false;
        };
    }])
    .controller("addEmployeeCtrl", [ '$location', '$scope', '$rootScope', function($location, $scope, $rootScope) {
        this.addEmployee = function() {
            $rootScope.employees.push($scope.employee);
            localStorage.setItem("employeesList", JSON.stringify($rootScope.employees));
            swal("Employee details saved!");
            $location.path("/admin/dashboard")
        };
    }])
    .controller("loginCtrl", [ '$scope', '$location', 'SessionService', '$rootScope', function($scope,$location, SessionService, $rootScope) {
        $scope.user = {};
        // Google
        $scope.$on('event:google-plus-signin-success', function (event, authResult) {
            // User successfully authorized the G+ App!
            // console.log('Signed in on google!', authResult);
            $location.path("/admin/dashboard");
            SessionService.setUserAuthenticated(true);
            localStorage.setItem('status', true);
            $scope.$apply();
            $scope.user.email = authResult.w3.U3;
            $scope.user.first_name = authResult.w3.ofa;
            $scope.user.last_name = authResult.w3.wea;            
        });
        $scope.$on('event:google-plus-signin-failure', function (event, authResult) {
            // User has not authorized the G+ App!
            // console.log('Not signed into Google Plus.');
            localStorage.removeItem('status');
            $rootScope.loggedIn = false;
        }); 
    }])
    .service('SessionService', ['$rootScope', function($rootScope){
        var userIsAuthenticated = localStorage.getItem('status') || false;;

        var value =  null;
        
        if (userIsAuthenticated) {
            $rootScope.loggedIn = true;
            //SessionService.setUserAuthenticated(value);
        }   
        this.setUserAuthenticated = function(value){
            userIsAuthenticated = value;
        };
        

        this.getUserAuthenticated = function(){
            return userIsAuthenticated;
        };
    }])
    .directive('headerView', function() {
        return {
            restrict: 'E',
            templateUrl: '../../views/header.html'
        }
    })
    .directive('employeeDetail', function() {
        return {
            restrict: 'E',
            templateUrl: '../../views/edit_employee.html'
        }
    })

    .directive('ageVerify', ageVerify);
      function ageVerify() {   
          return {
              restrict: 'A', // only activate on element attribute
              require: '?ngModel', // get a hold of NgModelController
              link: function(scope, elem, attrs, ngModel) {
                  if (!ngModel) return; // do nothing if no ng-model

                  // watch own value and re-validate on change
                  scope.$watch(attrs.ngModel, function() {
                      validate();
                  });

                  // observe the other value and re-validate on change
                  attrs.$observe('ageVerify', function(val) {
                      validate();
                  });

                  var validate = function() {
                    // Calculate age
                    var ageDifMs = Date.now() - new Date(attrs.ageVerify);
                    var ageDate = new Date(ageDifMs); // miliseconds from epoch
                    var ageIs = JSON.stringify(Math.abs(ageDate.getUTCFullYear() - 1970)); 
                    // values
                    var val1 = ngModel.$viewValue;
                    var val2 = ageIs;
                    // set validity
                    ngModel.$setValidity('ageVerify', val1 === val2);
                  };
              }
          }
      };
window.routes =
{
    '/login': {
        templateUrl: "../../views/login.html", 
        requireLogin: false
    }, 
    '/admin/dashboard': {
        templateUrl: "../../views/admin_dashboard.html", 
        requireLogin: true
    },
    '/admin/add-employee': {
        templateUrl: "../../views/add_employee.html", 
        requireLogin: true
    },
    '/admin/edit-employee': {
        templateUrl: "../../views/edit_employee.html", 
        requireLogin: true
    }

};  