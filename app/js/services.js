var OCDAppServ = angular.module('OCDAppServices', []);

//this factory is a service to provide the controllers with new Query data.
OCDAppServ.factory('QueryService' , ['$rootScope', '$http', '$location',
	function($rootScope, $http, $location){
		//since a factory returns an object, define a object.
		var queryService = {};
		
		//define local vars for holding the data.
		var queryData;
		var query;
		var page;
		var options;


		queryService.httpGetNewOCDData = function(newQuery, newPage, newOptions){

			var promise = $http.get('php/resultjson.php', {params:{q:newQuery, page:newPage, options:newOptions}} ).success(function(data) {
				
				if(data.error){
					console.log("phperror");
					console.log(data.error);
					alert("Error: php-failed");
					queryData = false;
					return;
				}

				queryData = data;
				query = newQuery;
				page = newPage;
				options = newOptions;
				
				//becouse the nav controllers depend on this data, broadcast it.
				$rootScope.$broadcast('New Query', {
					query: query,
				});
			});

			//return a promise for the routeProvider.
			return promise;
		};

		//return the data.
		queryService.getData = function(){
			if(queryData){
				return {
					queryData: queryData,
					query: query,
					page: page,
					options: options
				};
			}else
				return false;
		};

		//move to the requested page.
		queryService.moveToPage = function(newPage){
			var urlstring = 'query/'+query+"/page/"+newPage;
			
			//only add the options if they are defined
			urlstring += (options !== undefined) ? "/options/" + options : "";
			
			$location.path(urlstring);
			
		};

		//return the factory.
		return queryService;
	}]);