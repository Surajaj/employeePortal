"use strict()";
angular.module("myApp", ['ngRoute', 'directive.g+signin', 'ngMessages'])
    .config(['$routeProvider', '$locationProvider','$compileProvider', function($routeProvider, $locationProvider, $compileProvider) {
        // $compileProvider.debugInfoEnabled(false); // Disable debug mode
        $compileProvider.commentDirectivesEnabled(false); // Disable Compilation of Comment Directive
        $compileProvider.cssClassDirectivesEnabled(false);   // Disable Compilation of Class Directive     
        $locationProvider.html5Mode(true); // Remove # from url
		// Routes
        for(var path in window.routes) {
            $routeProvider.when(path, window.routes[path]);
        }   
        $routeProvider.otherwise({redirectTo: "/login"}); // If no url match found
    }])
    .run(['$rootScope','SessionService','$location', function($rootScope,SessionService,$location) {
        $rootScope.$on("$locationChangeStart", function(event, next, current) {
            for(var i in window.routes) {
                if(next.indexOf(i) != -1) {
                    if (SessionService.getUserAuthenticated() && next.endsWith('login')) {
                        $location.path("/admin/dashboard");
                    };
                    if(window.routes[i].requireLogin && !SessionService.getUserAuthenticated()) {
                        event.preventDefault();
                        swal("You need to be authenticated to see this page. Please login!");
                        $location.path("/login");
                    }
                }
            }
        });
    }])     
    .controller("MainCtrl", ["$rootScope", function( $rootScope) {
        $rootScope.employees = JSON.parse(localStorage.getItem("employeesList")) || [];
        $rootScope.userName = localStorage.getItem('user_admin_name') || null;
    }])
    .controller("adminCtrl", [ '$scope', '$location', 'SessionService', '$rootScope', '$q' , function($scope, $location, SessionService, $rootScope, $q) {
        
        $scope.get_employees = function (records) {
            return $q(function(resolve, reject) {
                setTimeout(function() {
                    if (records) {
                        resolve(records);
                    } else {
                        reject('Not found');
                    }
                }, 500);
            });
        }

        var promise = $scope.get_employees($rootScope.employees);
        promise.then(function(records) {
            $scope.employeeRecords = records;
        }, function(reason) {
            swal('Failed to fetch records, ' + reason);
        });
        
        // var Promise = $q.resolve($rootScope.employees); // Set employee records to promise
        // $scope.employeeRecords = Promise.$$state.value; // Fetch employee records by promise

        4// Logout
        $scope.logout = function() {
            SessionService.setUserAuthenticated(false);
            localStorage.removeItem('status_login');
            localStorage.removeItem('user_admin_name');
            $location.path("/login");
        };
        // Delete Employee
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
        $scope.isEditView = false; // Set default employee edit view to false
        // Edit Employee
        $scope.editEmployee = function(employee) {    
            $scope.isEditView = true;
            $scope.employeeDetail = employee;
            $scope.editIndex = $rootScope.employees.indexOf(employee);
        };
        // Save Employee
        $scope.saveEmployee = function() {
            $rootScope.employees[$scope.editIndex] = $scope.employeeDetail;
            localStorage.setItem("employeesList", JSON.stringify($rootScope.employees));
            swal("Employee details saved!");
            $scope.isEditView = false;
        };
    }])
    .controller("addEmployeeCtrl", [ '$location', '$scope', '$rootScope', function($location, $scope, $rootScope) {
        // Add Employee
        this.addEmployee = function() {
            $rootScope.employees.push($scope.employee);
            localStorage.setItem("employeesList", JSON.stringify($rootScope.employees));
            swal("Employee details saved!");
            $location.path("/admin/dashboard");
        };
    }])
    .controller("loginCtrl", [ '$scope', '$location', 'SessionService', '$rootScope', function($scope,$location, SessionService, $rootScope) {
        // Google Login
        // On Login success
        $scope.$on('event:google-plus-signin-success', function (event, authResult) {
            // User successfully authorized the G+ App!
            $rootScope.userName = authResult.w3.ofa;
            localStorage.setItem('user_admin_name', $rootScope.userName);
            SessionService.setUserAuthenticated(true);
            localStorage.setItem('status_login', true);
            $location.path("/admin/dashboard");
            $scope.$apply();
        });
        // On Login fail
        $scope.$on('event:google-plus-signin-failure', function (event, authResult) {
            // User has not authorized the G+ App!
            swal('Authentication failed. Pleas try agian');
        }); 
    }])
    .service('SessionService', function(){
        // Check if user was logged in, if not initialize 
        var userIsAuthenticated = localStorage.getItem('status_login') || null;
        var value =  null; // Initialize value
        // Set user state  
        this.setUserAuthenticated = function(value){
            userIsAuthenticated = value;
        };
        // Get user state
        this.getUserAuthenticated = function(){
            return userIsAuthenticated;
        };
    })
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
    .directive('ageVerify', function () {   
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

                  // Validate 
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
      });
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
    }
};  