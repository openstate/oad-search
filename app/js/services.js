var OCDAppServ = angular.module('OCDAppServices', []);

//this factory is a service to provide all the controllers with new Query data.
OCDAppServ.factory('QueryService' , ['$rootScope', '$http', '$location',
	function($rootScope, $http, $location){
		//since a factory returns an object, define a object.
		var queryService = {};
		
		var queryData;
		var query;
		var page;
		var options;

		queryService.getData = function(){
			return {
				queryData: queryData,
				query: query,
				page: page,
				options: options
			};

		};

		queryService.getNewApiData = function(newQuery, newPage, newOptions){

			return $http.get('php/resultjson.php', {params:{q:newQuery, page:newPage, options:newOptions}} ).success(function(data) {
				queryData = data;
				query = newQuery;
				page = newPage;
				options = newOptions;
				
				//becouse the nav controllers depend on this data, broadcast it.
				$rootScope.$broadcast('New Query', {
					query: query,
				});
			});
		};

		queryService.getPage = function(newPage){
			var urlstring = 'query/'+query+"/page/"+newPage;
			
			//only add the options if they are defined
			urlstring += (options !== undefined) ? "/options/" + options : "";
			
			$location.path(urlstring);
			
		};

		//return the factory.
		return queryService;
	}]);