var OCDAppServ = angular.module('OCDAppServices', []);

var baseURLprod = "http://api.opencultuurdata.nl/v0/";
var baseURLdev = "http://localhost:5000/v0/";
var baseURL = baseURLprod;

OCDAppServ.factory('StateService' , function(){
	var stateService = {};
	stateService.sidebarOpen = false;
	stateService.thumbSizeSmall = false;
	stateService.sourceSelect = ['rijksmuseum','fries_museum', 'textielmuseum'];
	return stateService;
});

//this factory is a service to provide the controllers with new Query data.
OCDAppServ.factory('QueryService' , ['$rootScope', '$http', '$location', '$q', 'StateService', 'MuseumCombineServ',  
	function($rootScope, $http, $location, $q, StateService, MuseumCombineServ){
		//since a factory returns an object, define a object.
		var queryService = {};
		
		//define local data holding vars.
		var queryData;
		var query;
		var page;
		var options;
		var optionsString;
		var institutionName;

		//the leftbar and the query use the facets of a search without options as a reference.
		var basefacets = false;
		
		
		//check if basefacets are available, otherwise get some.
		//return a promise
		function checkbasefacets (newQuery, newPage, newOptions, institution){
			var deferred = $q.defer();
			institutionName = institution;

			if(basefacets || (!newOptions && !institution)){
				//if basefacets are set or there are no options no need
				//for extra ajax call 
				deferred.resolve();
			} else {
				//if there is a instution, edit the base facet list to only include those options.
				var options;

				if(institution){
					musea = MuseumCombineServ.getMusea();
					for (var i = musea.length - 1; i >= 0; i--) {
						if(musea[i].uri == institution){
							options = base64url_encode({
								'collection': musea[i].sources
							});	
						}
					};
				}

				getHttp(newQuery, newPage, options).then(
					function(data) {
						basefacets = data.facets;
						
						deferred.resolve();
					},
					function(reason) {
						console.log('Failed: ' + reason);
					}
				);
			}
			return deferred.promise;
		}

		//ajax call to the php script return a promise.
		function getHttp(newQuery, newPage, newOptions, useFacets){
			var params = {q:newQuery, page:newPage, options:newOptions, use_facets:useFacets};
			
			if(StateService.thumbSizeSmall == true){
				params['thumbnailresults'] = 'true';
			}
			return $http.get('php/resultjson.php', {params:params})
			.then(function(data) {

				if(typeof(data.data) == "String" && data.data.substring(0, 5) == "<?php"){
					throw {
						message: 'please turn on php on you\'re webserver'
					};
				}
				
				if(data.data.error){
					console.log("phperror");
					console.log(data.error);
					queryData = false;
					throw {
						message: 'php get failed, check console for details.'
					};
				}
				data.data.query = newQuery;
				//debugger;
				return data.data;
			});
		}

		queryService.simplehttpGet = function(newQuery){
			//for the simple get no facets or options are needed.
			return getHttp(newQuery, 1, undefined, false);
		};

		queryService.httpGetNewOCDData = function(newQuery, newPage, newOptions, institution){
			
			/**************************
			first detenmine if basefacets need to be get.
			then make a http get with the query, wich relays on the basefacets
			then do something with the returned data.

			completepromise  will be returned to the router, 
			the router will wait until the completepromise is resolved.
			****************************/
			var completepromise = checkbasefacets(newQuery, newPage, newOptions, institution)
			//then get the actual query.
			.then( function() {
				if(!!newOptions || institution) {
					//becouse the api does not feature exclude filters
					//use the basefacets to construct a inclusion list.	
					var excludeoptions = {};
					var includeoptions = {};

					if(newOptions) {
						excludeoptions = base64url_decode(newOptions);
					} 

					if(!excludeoptions['collection']) {
						includeoptions['collection'] = [];
						var baseterms = basefacets['collection'].terms;
						for(var i = 0;i < baseterms.length; i++){
							includeoptions['collection'].push(baseterms[i].term);
						}
					}

					for (var prop in excludeoptions){
						if(excludeoptions.hasOwnProperty(prop)){

							//date is the only option that is not a exlusion list.
							if(prop == 'date' || prop == 'onlyvideo' ){
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
					if(StateService.thumbSizeSmall === true){
						includeoptions['thumbnailresults'] = true;
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
			//if there are filter options, return the filter options.
			if(!!options && options.date){
				//TODO: check if options are correct.
				return options.date;
			}
			else {
				//if the query had new data, update basefacets.
				if(queryData.facets && queryData.facets.date)
					basefacets.date = queryData.facets.date;

				var daterange = basefacets.date.entries;
				if(daterange.length > 0) {
					var firstdate = new Date(daterange[0].time);
					var lastdate = new Date(daterange[daterange.length - 1].time);
					var min = firstdate.getFullYear();
					var max = lastdate.getFullYear();
					
					//because there are no options, set usersettings to min and max.
					return {
						min:min,
						max:max,
						usermin:min,
						usermax:max
					};
				}
			}
		};

		//clear the query, if navegating to home screen.
		queryService.clearQuery = function(){
			query = "";
			};

		//move to the requested page.
		queryService.moveToPage = function(newPage){
			var urlstring = 'query/'+query+"/page/"+newPage;
			
			//only add the options if they are defined
			urlstring += (optionsString !== undefined) ? "/options/" + optionsString : "";

			//if a institution is defined. prepend
			if(institutionName){
				urlstring = "institution/" + institutionName + "/" + urlstring;
			}
			
			$location.path(urlstring);
		};

		queryService.newSearchString = function(queryString){
			var urlstring = 'query/'+queryString+"/page/1";

			//reset the basefacets.
			basefacets = false;

			//only add the options if they are defined
			urlstring += (optionsString !== undefined) ? "/options/" + optionsString : "";

			//if a institution is defined. prepend
			if(institutionName){
				urlstring = "institution/" + institutionName + "/" + urlstring;
			}

			$location.path(urlstring);
		};


		queryService.getFacet = function(facetname, fixedfacet){
			//build a list off all the terms;
			var results = [];
			if(!basefacets)
				return;

			var basefacet = basefacets[facetname];
			var queryfacet = queryData.facets[facetname];

			//if the filter is not in use or fixed, return the terms of the last query.
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
				//if the facet/filter is in use or fixed, build a list based on the basefacets.
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
					//this is done before the query check, becouse otherwise multiauthor
					//items, make filtered authors show up in the list. 
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

					//if none off the above, return empty term with active checkbox.
					//one off the other filters pushed results out of the list.
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
			
			//if it tries to set a empty optionlist, delete the option instead.
			if(optiondata.length === 0){
				if(!!options[facetname])
					delete options[facetname];
			}
			else
				options[facetname] = optiondata;

			var urlstring;
			//if options is not empty encode option.
			if(!jQuery.isEmptyObject(options)){
				var encodeOptions = base64url_encode(options);
				urlstring = 'query/'+query+"/page/1/options/"+encodeOptions;
			}
			else {
				urlstring = 'query/'+query+"/page/1";

				//clear the optionstring
				optionsString = undefined;
			}

			//if a institution is defined. prepend
			if(institutionName){
				urlstring = "institution/" + institutionName + "/" + urlstring;
			}

			$location.path(urlstring);
			
			//the daterange slider does not start a digest, so start manualy.
			if(facetname == 'date' && $rootScope.$$phase != '$apply' && $rootScope.$$phase != '$digest'){
				$rootScope.$apply();
			}
		};

		queryService.clearFilterOptions = function(){
			options = {};
			optionsString = undefined;
			basefacets = false;
		}

		queryService.clearInstitution = function(){
			institutionName = undefined;
		}

		//return the factory.
		return queryService;
	}
]);

OCDAppServ.factory('SourcesService' , ['$http',
	function($http){
		
		SourcesService = {};
		//ajax call to the sources list
		SourcesService.getSources = function() {
			return $http.get(baseURL + 'sources')
			.then(function(data) {
				return data.data;
			});
		};

		return SourcesService;
	}
]);


OCDAppServ.factory('JsonService' , ['$http', '$q',
	function($http, $q){
		var jsonService = {};
		var rights;

		jsonService.getMusea = function(){
			return $http.get('https://raw.githubusercontent.com/openstate/ocd-search/master/app/data/musea.json');
			//for local testing:
			//return $http.get('/ocd-search/app/data/musea.json');
		};

		jsonService.getHomeQuery = function(){
			return $http.get('https://raw.githubusercontent.com/openstate/ocd-search/master/app/data/homequerys.json');
		};

		jsonService.resolveRights = function(){
			//provent unessesary trips
			if(rights){
				var defer = $q.defer();
				defer.resolve();
				return defer.promise;
			}

			return $http.get('https://raw.githubusercontent.com/openstate/ocd-search/master/app/data/rights.json')
				.then(function(data){
					rights = data.data;
				});
		};

		jsonService.getRights = function(){
			return rights;
		};


		return jsonService;

	}]);

//get a list of musea and source information.
OCDAppServ.factory('MuseumCombineServ' , ['$q', 'JsonService' , 'SourcesService',
	function($q, JsonService, QueryService){
		var MuseumCombineServ = {};
		var MuseaData;
		var museaCombinePromise = $q.defer();

		//get sources from the API
		var sourcePromise = SourcesService.getSources();
		//to be able to update the museau witout redeploy, get the json from git.
		var museaPromise = JsonService.getMusea();
			
		function resolveMusea(){
			//if all are resolved
			$q.all([sourcePromise, museaPromise]).then(function(data){
				var terms = data[0].sources;
				var Musea = data[1].data;

				//add the source counts to the musea
				for(var j = 0; j < Musea.length; j++ ){
					Musea[j].count = 0;
					for(var k = 0; k < Musea[j].sources.length; k++ ){
						for(var i = 0; i < terms.length; i++ ){
							if(Musea[j].sources[k] == terms[i].name){
								Musea[j].count += terms[i].count;
								break;
							}
						}
					}
				}				

				//put the object keys in a array to be able to shuffle
				var shufflearray = [];
				for (var key in Musea) {
					shufflearray.push(key);
				}

				//standard Fisher-Yates (aka Knuth) Shuffle.
				function shuffle(array) {
					var currentIndex = array.length, temporaryValue, randomIndex ;

					// While there remain elements to shuffle...
					while (0 !== currentIndex) {

					// Pick a remaining element...
					randomIndex = Math.floor(Math.random() * currentIndex);
					currentIndex -= 1;

						// And swap it with the current element.
						temporaryValue = array[currentIndex];
						array[currentIndex] = array[randomIndex];
						array[randomIndex] = temporaryValue;
					}
					return array;
				}
				//shuffle it
				shufflearray = shuffle(shufflearray);

				MuseaData = [];
				for (var i = 0; i < shufflearray.length; i++ ) {
					MuseaData.push(Musea[shufflearray[i]])
				};

				museaCombinePromise.resolve(MuseaData);
			});
		}

		MuseumCombineServ.resolveMusea = function(){
			//provent unessesary trips
			if(MuseaData){
				var defer = $q.defer();
				defer.resolve(MuseaData);
				return defer.promise;
			} else {
				resolveMusea();
				return museaCombinePromise.promise;
			}
		};

		MuseumCombineServ.getMusea= function(){
			return MuseaData;
		};

		return MuseumCombineServ;
	}]);


//some data is always needed, so all routes should go to the startup services
OCDAppServ.factory('StartUpService' , ['$q', 'JsonService' , 'MuseumCombineServ',
	function($q, JsonService, MuseumCombineServ){
		StartUpService = {};

		StartUpService.init = function(){
			var defer = $q.defer();
			var rights = JsonService.resolveRights();
			var Musea = MuseumCombineServ.resolveMusea();

			$q.all([rights, Musea]).then(function(data){
				defer.resolve();
			});

			return defer.promise;
		};

		return StartUpService;

	}]);

OCDAppServ.factory('DetailService' , ['$rootScope', '$http', '$routeParams',
	function($rootScope, $http, $routeParams){
		var detailService = {};

		//encode the url
		detailService.getURL = function (url) {
			var urlpath = url.split( '/' );
			return '#/object/' + urlpath[4] + '/' + urlpath[5] ;
		}
		
		detailService.getApiUrl = function () {
			return url = baseURL + $routeParams.collection + '/' + $routeParams.objectid;
		}

		detailService.getItem = function () {
			return $http.get(detailService.getApiUrl());
		}
		
		return detailService;
	}]);


//service for managing the rights.
OCDAppServ.factory('RightUrlService', ['JsonService', function(JsonService){
		var rightUrlService = {};

		var linkModel = JsonService.getRights();
		
		rightUrlService.returnlinkArray = function(rightsArray){
			for(var i=0; i<rightsArray.length; i++){
				var rightObject  = rightsArray[i];
				if (!!linkModel[rightObject.name]) {
					rightObject.isUrl = true;
					rightObject.Url = rightObject.name;
					rightObject.showName = linkModel[rightObject.name];
				
				} else {
					rightObject.isUrl = false;
				}
			}
			return rightsArray;		
		}

		rightUrlService.checkForUrl = function(rightstring) {

			var object = {};

			if (!!linkModel[rightstring]) {
				object.isUrl = true;
				object.name = linkModel[rightstring];
				object.Url = rightstring;

			} else {
				object.isUrl = false;
				object.name = rightstring;
			}

			return object;
		}



		
		return rightUrlService;
	}]);



	

//
function toJSONandCompres(obj){

	return window.LZString.compressToBase64(JSON.stringify(obj));
}

function compresString (string) {
	return window.LZString.compressToBase64(string).split('/').join('-');
}

function decompresString (compresedString){
	return window.LZString.decompressFromBase64(compresedString.split('-').join('/'));
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