var OCDAppServ = angular.module('OCDAppServices', []);

//this factory is a service to provide the controllers with new Query data.
OCDAppServ.factory('QueryService' , ['$rootScope', '$http', '$location', '$q',
	function($rootScope, $http, $location, $q){
		//since a factory returns an object, define a object.
		var queryService = {};
		
		//define local data holding vars.
		var queryData;
		var query;
		var page;
		var options;
		var optionsString;

		//the leftbar and the query use the facets of a search without options as a reference.
		var basefacets = false;
		
		//check if basefacets are available, otherwise get some.
		function checkbasefacets (newQuery, newPage, newOptions){
			var deferred = $q.defer();
		
			if(basefacets || !newOptions){
				//if basefacets are set or there are no options no need
				//for extra ajax call 
				deferred.resolve();
			} else {

				getHttp(newQuery, newPage).then(function(data) {
					basefacets = data.facets;
					deferred.resolve();
				},
				function(reason) {
					console.log('Failed: ' + reason);
				});
			}
			return deferred.promise;
		}

		//ajax call to the php script return a promise.
		function getHttp(newQuery, newPage, newOptions){
			
			return $http.get('php/resultjson.php', {params:{q:newQuery, page:newPage, options:newOptions}})
			.then(function(data) {
				
				if(data.error){
					console.log("phperror");
					console.log(data.error);
					queryData = false;
					throw {
						message: 'php get failed, check console for details.'
					};
				}
				return data.data;
			});
		}

		queryService.httpGetNewOCDData = function(newQuery, newPage, newOptions){
			
			/**************************
				first detenmine if basefacets need to be get.
				then make a http get with the query, wich relays on the basefacets
				then do something with the returned data.

				completepromise  will be returned to the router, 
				the router will wait until the completepromise is resolved.
			****************************/
			var completepromise = checkbasefacets(newQuery, newPage, newOptions)
			//then get the actual query.
			.then( function() {
				if(!!newOptions) {
					//becouse the api does not feature exclude filters
					//use the basefacets to construct a inclusion list.					
					var excludeoptions = base64url_decode(newOptions);
					var includeoptions = {};

					for (var prop in excludeoptions){
						if(excludeoptions.hasOwnProperty(prop)){
							//date is the only option that is not a exlusion list.
							if(prop == 'date'){
								includeoptions[prop] = excludeoptions[prop];
								continue;
							}

							includeoptions[prop] = [];
							var baseterms = basefacets[prop].terms;
							for(var i = 0;i < baseterms.length; i++){
								if(excludeoptions[prop].indexOf(baseterms[i].term) == -1){
									includeoptions[prop].push(baseterms[i].term);
								}
							}
						}
					}
					var includeoptionsstring = toJSONandCompres(includeoptions);

					console.log(includeoptionsstring);
					return getHttp(newQuery, newPage, includeoptionsstring);
				} else {
					return getHttp(newQuery, newPage);
				}
			})
			//then if everything completed, do something with the data.
			.then(function(data) {

				queryData = data;
				query = newQuery;
				page = newPage;

				if(!!newOptions){
					optionsString = newOptions;
					options = base64url_decode(optionsString);
				}
				//if there are no basefacets and no options, 
				//then set the basefacets from the query.
				else if(!basefacets){
					basefacets = queryData.facets;
				}
					
				//becouse the nav controllers depend on this data, broadcast it.
				$rootScope.$broadcast('New Query', {
					query: query,
				});

			}, function(reason) {
				//the promise failed.
				console.log('Failed: ' + reason);
			});

			//return a promise to the routeProvider.
			return completepromise;
		};


		//return the data.
		queryService.getData = function(){
			if(queryData){
				return {
					queryData: queryData,
					query: query,
					page: page,
				};
			}else
			return false;
		};


		queryService.getBaseFacets = function(){
			return basefacets;
		};

		//the Date range slider needs to know min max and user settings
		queryService.getDateObject = function(){
			//if the datefilter is not in use, update the bacefacets.
			if(options && !options.date && queryData.facets && queryData.facets.date)
				basefacets.date = queryData.facets.date;
						
			var daterange = basefacets.date.entries;
			if(daterange.length > 0){
				var firstdate = new Date(daterange[0].time);
				var lastdate = new Date(daterange[daterange.length - 1].time);
				var min = firstdate.getFullYear();
				var max = lastdate.getFullYear();

				var usermin;
				var usermax;

				//if options are defined, use options
				if(!!options && options.date){
					usermin = options.date.usermin;
					usermax = options.date.usermax;

					//check if useroptions are within bounds. 
					if(usermax < min)
						usermax = min;

					if(usermin > max)
						usermin = max;

				} else {
					usermin = firstdate.getFullYear();
					usermax = lastdate.getFullYear();
				}

				var dateObject = {
					min:min,
					max:max,
					usermin:usermin,
					usermax:usermax
				};
			//	console.log(dateObject);
				return dateObject;
			}
		};

		//move to the requested page.
		queryService.moveToPage = function(newPage){
			var urlstring = 'query/'+query+"/page/"+newPage;
			
			//only add the options if they are defined
			urlstring += (optionsString !== undefined) ? "/options/" + optionsString : "";
			
			$location.path(urlstring);
			
		};

		queryService.newSearchString = function(queryString){
			var urlstring = 'query/'+queryString+"/page/1";

			//reset the basefacets.
			basefacets = false;
			//only add the options if they are defined
			urlstring += (optionsString !== undefined) ? "/options/" + optionsString : "";

			$location.path(urlstring);
		};


		queryService.getFacet = function(facetname, fixedfacet){
			//build a list off all the terms;
			var results = [];
			var basefacet = basefacets[facetname];
			var queryfacet = queryData.facets[facetname];

			//if the filter is not in use or fixed, return the terms or the last query.
			if(!fixedfacet && options && !options[facetname]){
				basefacets[facetname] = queryData.facets[facetname];
				for(var i =0; i < queryfacet.terms.length; i++ ){
					
					var term = queryfacet.terms[i];
						results.push({
						name: term.term,
						count: term.count,
						active:true
					});
					
				}
			} else {
				//if the facet/filter is in use or fixed, base the list on the basefacets.
				for(var i =0; i < basefacet.terms.length; i++ ){
					var term = basefacet.terms[i];
					
					//if no options are defined, just push the basefacets. (for fixed filters)
					if(!options){
						results.push({
							name: term.term,
							count: term.count,
							active:true
						});
						continue;
					}

					//if in filterlist, return empty term.
					if(options[facetname] && options[facetname].indexOf(term.term) > -1){
						results.push({
							name: term.term,
							count: 0,
							active:false //turn off the checkbox
						});
						continue;
					}

					//determine if the term is in the returned query.
					var inQuery = false;
					for(var j =0; j < queryfacet.terms.length; j++ ){
						if(queryfacet.terms[j].term == term.term){
							results.push({
								name: term.term,
								count: queryfacet.terms[j].count,
								active:true
							});
							inQuery = true;
							break;
						}
					}

					if(inQuery)
						continue;

					//if non off the above, return empty term with active checkbox.
					results.push({
						name: term.term,
						count: 0,
						active:true
					});
				}
			}
			return results;
		};

		queryService.getFilterOption= function(facetname){
			if(!!options && options[facetname])
				return options[facetname];
			else
				return [];
		};

		//set the options object.
		queryService.setFilterOption = function(facetname, optiondata){
			if(!options)
				options = {};
			
			if(optiondata.length === 0){
				if(!!options[facetname])
					delete options[facetname];
			} else
				options[facetname] = optiondata;

			debugger;
			var urlstring;
			//if options is empty, remove options from url
			if(!jQuery.isEmptyObject(options)){
				var encodeOptions = base64url_encode(options);
				
				urlstring = 'query/'+query+"/page/1/options/"+encodeOptions;
			} else
				urlstring = 'query/'+query+"/page/1";
			
			//console.log(options);
			//console.log(urlstring);

			$location.path(urlstring);
			
			if(facetname == 'date' && $rootScope.$$phase != '$apply' && $rootScope.$$phase != '$digest'){
				$rootScope.$apply();
			}
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

//base 64 contains /, wich upset the routeprovider, so replace.
function base64url_encode(obj) {
	return toJSONandCompres(obj).split('/').join('-');
}

function base64url_decode(string) {
    return decompresToObject(string.split('-').join('/'));
}

