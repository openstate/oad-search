//define youre app and declare dependencies
var OCDApp = angular.module('OCDApp', [
	'ngRoute',           //routes used below
  'OCDAppServices',    //our services
  'OCDAppControllers'  //our controlers
]);

//the routeprovider is responcible for the url management.
OCDApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/query/:q', {
        redirectTo: '/query/:q/page/1'
      }).
      when('/query/:q/page/:page',  {
        templateUrl: 'app/partials/query.html',
        controller: 'queryCtrl',
        //if you define a resolve, the routeProvider will wait till till all promises defined here
        //are resolved before updating the route and the data. This makes the transions smoother.
        resolve:{
          getData:['$route' , 'QueryService', function($route, QueryService) {
            //the Queryservice is our own service, responcible for communicating with the OCD API. 
            var queryPromise = QueryService.httpGetNewOCDData($route.current.params.q, $route.current.params.page);
            return queryPromise;
          }]
        }
      }).
      otherwise({
        redirectTo: '/query/rembrandt/page/1'
      });


  }]);