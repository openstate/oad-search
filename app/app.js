

var OCDApp = angular.module('OCDApp', [
	'ngRoute',
  'OCDAppServices',
  'OCDAppControllers'
]);

OCDApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/query/:q', {
        redirectTo: '/query/:q/page/1'
      }).
      when('/query/:q/page/:page',  {
        templateUrl: 'app/partials/query.html',
        controller: 'queryCtrl',
        resolve:{
          //if you define a resolve, the routeProvider wil wait till the resolve is finished
          //before updating the route and the data. This makes the transions smoother
          data:['$route' , 'QueryService', function($route, QueryService) {
            console.log($route.current.params);
            var queryPromise = QueryService.getNewApiData($route.current.params.q, $route.current.params.page);
            console.log(queryPromise);
            return queryPromise;
          }]
        }
      }).
      otherwise({
        redirectTo: '/query/rembrandt/page/1'
      });


  }]);

    /*,
        resolve:{
          data:["QueryService", function(QueryService) {

          }];*/



