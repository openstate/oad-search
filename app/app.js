//define youre app and declare dependencies
var OCDApp = angular.module('OCDApp', [
	'ngRoute',           //routes used below
  'ngTouch',
  'ui-rangeSlider',    //range-slider used in left bar
  'infinite-scroll',   //infinite scroll    
  'OCDAppServices',    //our services
  'OCDAppControllers'  //our controlers
  ]);

//the routeprovider is responcible for the url management.
OCDApp.config(['$routeProvider',
   function($routeProvider) {
    $routeProvider.
    when('/', {
      templateUrl: 'app/partials/home.html',
      controller: 'homeCtrl',
      resolve:{
        getData: [ 'StartUpService', function(StartUpService) {
            return StartUpService.init();
        }]
      }
    }).
    when('/about', {
      templateUrl: 'app/partials/about.html',
      controller: 'aboutCtrl'
    }).
    when('/object/:collection/:objectid', {
      templateUrl: 'app/partials/details.html',
      controller: 'detailCtrl',
      resolve:{
        getData: [ 'StartUpService', function(StartUpService) {
            return StartUpService.init();
        }]
      }
    }).
    when('/query/:q',  {
      templateUrl: 'app/partials/query.html',
      controller: 'queryCtrl',
        //if you define a resolve, the routeProvider will wait till till all promises defined here
        //are resolved before updating the route and the data. This makes the transions smoother.
        resolve:{
          getData:['$route' , 'QueryService', 'StartUpService', '$q',  function($route, QueryService, StartUpService, $q) {
            //the Queryservice is our own service, responcible for communicating with the OCD API.
            var defer = $q.defer();
            StartUpService.init().then(function(data1){
              QueryService.httpGetNewOCDData($route.current.params.q, 1, true).then(function(data2){
                defer.resolve(data2);
              });
            });  
            return defer.promise;
          }]
        }
      }).
    when('/query/:q/options/:options',  {
      templateUrl: 'app/partials/query.html',
      controller: 'queryCtrl',
        //if you define a resolve, the routeProvider will wait till till all promises defined here
        //are resolved before updating the route and the data. This makes the transions smoother.
        resolve:{
          getData:['$route' , 'QueryService', 'StartUpService', '$q',  function($route, QueryService, StartUpService, $q) {
            //the Queryservice is our own service, responcible for communicating with the OCD API.
            var defer = $q.defer();
            StartUpService.init().then(function(data1){
              QueryService.httpGetNewOCDData($route.current.params.q, 1, true, $route.current.params.options).then(function(data2){
                defer.resolve(data2);
              });
            });  
            return defer.promise;
          }]
        }
      }).
    when('/institution/:institutionUri/', {
      redirectTo: '/institution/:institutionUri/query/de/'
    }).
    when('/institution/:institutionUri/query/:q/',  {
      templateUrl: 'app/partials/query.html',
      controller: 'queryCtrl',
        //if you define a resolve, the routeProvider will wait till all promises defined here
        //are resolved before updating the route and the data. This makes the transions smoother.
        resolve:{
          getData:['$route' , 'QueryService', 'StartUpService', '$q',  function($route, QueryService, StartUpService, $q) {
            //the Queryservice is our own service, responcible for communicating with the OCD API.
            var defer = $q.defer();
            StartUpService.init().then(function(data1){

              QueryService.httpGetNewOCDData($route.current.params.q, 1, true, false, $route.current.params.institutionUri).then(function(data2){
                defer.resolve(data2);
              });

            });  
            return defer.promise;
          }]
        }    
      }).
    when('/institution/:institutionUri/query/:q/options/:options',  {
      templateUrl: 'app/partials/query.html',
      controller: 'queryCtrl',
        //if you define a resolve, the routeProvider will wait till all promises defined here
        //are resolved before updating the route and the data. This makes the transions smoother.
        resolve:{
          getData:['$route' , 'QueryService', 'StartUpService', '$q',  function($route, QueryService, StartUpService, $q) {
            //the Queryservice is our own service, responcible for communicating with the OCD API.
            var defer = $q.defer();
            StartUpService.init().then(function(data1){


              QueryService.httpGetNewOCDData($route.current.params.q, 1, true, $route.current.params.options, $route.current.params.institutionUri).then(function(data2){
                defer.resolve(data2);
              });


            });  
            return defer.promise;
          }]
        }      
      })
    .otherwise({
      templateUrl: 'app/partials/viernulvier.html',
      controller: 'vierNulVierCtrl'
    });


  }]);

OCDApp.config(['$provide', function($provide) {
            $provide.decorator('$exceptionHandler', ['$delegate', '$injector', function($delegate, $injector) {
                return function(exception) {
                    $injector.invoke(['$rootScope', function($rootScope) {
                        $rootScope.$broadcast('error', exception.message);
                    }]);
                
                return $delegate(exception);
                };
            }]);
        }]);

OCDApp.config(function($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    'self',
    // Allow loading from our assets domain.  Notice the difference between * and **.
    'http://api-nl.archaeologydata.com/**'
  ]);
});

//here the rootscope object loadingview is set, the loading view is based on this variable.
OCDApp.run(['$rootScope', function($root) {
  $root.$on('$routeChangeStart', function(e, curr, prev) {
    if (curr.$$route && curr.$$route.resolve) {
      // Show a loading message until promises are not resolved
      $root.loadingView = true;
    }
  });
  $root.$on('$routeChangeSuccess', function(e, curr, prev) {
    // Hide loading message
    $root.loadingView = false;
  });
  $root.$on('$routeChangeError', function(e, curr, prev) {
    // Error in route
    console.log("error in route");
  });


}]);
