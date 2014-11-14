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
		var options = {};
		

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
				queryData.collections = {};

				//build a list off all the facets and set to true;
				var facets = queryData.facets.collection.terms;
				for(var i =0; i < facets.length; i++ ){
					queryData.collections[facets[i].term] = true;
				}



				if(options) {
					var optionsObj = decompresToObject(options);

					optionsObj.exclude.sort();


					//add the excluded items to the list.
					for(var i= 0; i < optionsObj.exclude.length; i++){
						queryData.collections[optionsObj.exclude[i]] = false;
						queryData.facets.collection.terms.push({count:0, term:optionsObj.exclude[i]});
					}
				}

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

		queryService.updateCollections = function(excludeArray){

			options = {
				exclude: excludeArray
			};

			var encodeOptions = toJSONandCompres(options);
			var urlstring = 'query/'+query+"/page/"+page+"/options/"+encodeOptions;
			console.log(urlstring);		
			$location.path(urlstring);
			
		};





		//return the factory.
		return queryService;
	}]);

function toJSONandCompres(obj){
	return window.LZString.compressToBase64(JSON.stringify(obj));
}

function decompresToObject(string){
	return JSON.parse(window.LZString.decompressFromBase64(string));
}

