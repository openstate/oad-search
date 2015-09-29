var OCDAppCtrl = angular.module('OCDAppControllers', ['OCDAppServices']);

//this controler controlls the home screen
OCDAppCtrl.controller('homeCtrl', ['$scope', 'QueryService', 'JsonService', '$q', 'MuseumCombineServ',
	function ($scope, QueryService, JsonService, $q, MuseumCombineServ) {
		
		//clearAll
		QueryService.clearQuery();
		QueryService.clearFilterOptions();
		QueryService.clearInstitution();

		$('#myCarousel a').click(function(event){
			event.preventDefault();
		})

		$scope.isActive = function(index) {
			if(index == 0)
				return 'active';
		}

		//get the musea list.		
		var musea = MuseumCombineServ.getMusea();

		$scope.carousel = [];

		//push to the carousel in sets of 4
		for (var i = -1, j= -1; i < musea.length-1; ) {
			var num = ++i;
			if((num % 4) === 0 ){
				$scope.carousel[++j] = [];
			}
			$scope.carousel[j].push(musea[i]);
		}
		
		
		$('.carousel').carousel({
			interval: 2800
		});
	
		//get the first restult of six example query's.
		//to be able to update the 6 default examples witout redeploy, get the json from git.
		JsonService.getHomeQuery().then(function(data){
			var examplequeries = data.data;
			$scope.examplelist = [];
			for(var i=0; i < examplequeries.length; i++){
				QueryService.simplehttpGet(examplequeries[i])
				.then(function(data){
					if(data.results[0]){
						$scope.examplelist.push({
							title:data.query,
							firstresult:[data.results[0]]
						});
					}
				});
			}
		});

		
		$scope.goToQuery = function(){
			QueryService.newSearchString(this.item.title);
		};

	}]);

	OCDAppCtrl.controller('aboutCtrl', ['QueryService',
		function ( QueryService) {
		
			QueryService.clearQuery();
			QueryService.clearFilterOptions();
	}]);



//this controlls the query screen
OCDAppCtrl.controller('queryCtrl', ['$scope', 'QueryService', 'StateService','$route',
	function ($scope, QueryService, StateService, $route) {

		$scope.closeMenu = function(){
			StateService.sidebarOpen = false;
			$scope.sideBarOpen = StateService.sidebarOpen;
		};

		$scope.openMenu = function(){
			StateService.sidebarOpen = true;
			$scope.sideBarOpen = StateService.sidebarOpen;
		};

		//get the data from the Queryservice
		data = QueryService.getData();
		console.log(data);
		
		$scope.nextPageLoading = true;

		if(data){
			$scope.results =  data.queryData.results;
			if($scope.results.length > 1)
				$scope.nextPageLoading = false;
		}

		$scope.loadingText = 'loading...';
		var noMoreResults = false;

		$scope.nextPage = function (){
			$scope.nextPageLoading = true;
			if(noMoreResults){
				setTimeout(function(){ $scope.nextPageLoading = false; }, 100);
				return;
			}
			QueryService.getNextPage().then(function() {
				var data = QueryService.getData().queryData;
				if(!data || data.results.length === 0){
					$scope.loadingText = 'no more results';
					noMoreResults = true;
					return;
				}

				for (var i = 0; i < data.results.length; i++) {
					$scope.results.push(data.results[i]);
				};
				
				$scope.nextPageLoading = false;
			});
		};

		$scope.sideBarOpen = StateService.sidebarOpen;

		$scope.showsidebar = function (){
			StateService.sidebarOpen = ($scope.sideBarOpen) ? false : true;
			$scope.sideBarOpen = StateService.sidebarOpen;
		};

		//register a callback so the navbar controller can change as well.
		var sideBarChangeCallback = function(){
			$scope.sideBarOpen = StateService.sidebarOpen;
		};

		StateService.registerSidebarOpenobserverCallback(sideBarChangeCallback);

		$scope.thumbSizeSmall = StateService.thumbSizeSmall;
		
		$scope.toggleThumbSize = function() {
			if($scope.thumbSizeSmall == false){
				StateService.thumbSizeSmall = true;
				$scope.thumbSizeSmall = true;
			}				
			else {
				$scope.thumbSizeSmall = false;
				StateService.thumbSizeSmall = false;
			}
			$route.reload();
		}

	}]);

//this controller parses all the item detail data. 
OCDAppCtrl.controller('ItemCtrl' , ['$scope', '$http', 'DetailService', 'RightUrlService', '$location', 
	function ($scope, $http, DetailService, RightUrlService, $location) {
		var path = 	$location.path().split("/");
		//itemcontrolelr is used for both the detailview and the queryview
		var isDetailView = ( path[1] == 'object' ? true : false);
		var isQueryView = ( isDetailView ? false :true );

		//this controller is used in the detail and the queryview, but it needs slight tweaking for both.
		if(isQueryView){
			itemDetails = $scope.item._source;
			$scope.apiId = $scope.item._id || "";
			$scope.apiUrl = itemDetails.meta.ocd_url || "";
			$scope.detailUrl = DetailService.getURL($scope.apiUrl);

			//only show year or century in query
			if(itemDetails.date){
				var d = new Date(itemDetails.date);
				if(itemDetails.date_granularity){

					var dateString;
					switch(itemDetails.date_granularity) {
						case 2:
							dateString = d.getFullYear();
							dateString.substring(0, str.length - 1);
							dateString = parseInt(dateString) + 1;
							dateString = dateString + "th Cent.";
							break;
						default:
							 dateString = d.getFullYear();
					}
					window.test = d;
					$scope.date = dateString;

				}
				else{
					$scope.date = d.getFullYear();
				}
			}
		}

		else if(isDetailView){
			itemDetails = $scope.item;
			$scope.apiUrl = DetailService.getApiUrl();
			$scope.apiId = $scope.apiUrl.split('/')[5];

			//show detailed time.
			if(itemDetails.date){
				var d = new Date(itemDetails.date);
				if(itemDetails.date_granularity){

					var dateString;
					//Change how the date is displayed based on the granularity.
					switch(itemDetails.date_granularity) {
						case 2:
							dateString = d.getFullYear();
							dateString.substring(0, str.length - 1);
							dateString = parseInt(dateString) + 1;
							dateString = dateString + "th Century";
							break;
						case 4:
							dateString = d.getFullYear();
							break;
						case 8:
							dateString = d.toLocaleDateString();
							break;
						case 14:
							dateString = d.toLocaleString();
							break;
						default:
							 dateString = d.toLocaleDateString();
					}
					window.test = d;
					$scope.date = dateString;

				}
				else{
					$scope.date = d.getFullYear();
				}
			}
		}

		$scope.title = itemDetails.title || "Title unknown";
				
		//show the first author
		$scope.author = itemDetails.authors && itemDetails.authors[0] || "Author unknown";
		
		//if more authors, show the three dots and add title text.
		if(itemDetails.authors && itemDetails.authors.length > 1) {
			$scope.authorhooverindicate = "...";
			
			var hoovertext = "";
			for(var i = 0; i < itemDetails.authors.length; i++) {
				hoovertext += itemDetails.authors[i] + ' / ';
			}
			
			$scope.authorhoover = hoovertext.slice(0,-3);
		}

		$scope.collection = itemDetails.meta.collection || "Collection unknown";
		$scope.originalCollectionUrl = itemDetails.meta.original_object_urls.html || "";
		
		$scope.rights = RightUrlService.checkForUrl(itemDetails.meta.rights);

		$scope.description = itemDetails.description;
		
		var myMediaItem;

		$scope.showPlayer = false;
		$scope.videosources = [];
		
		//resolve the image.
		for (var i = 0; i < itemDetails.media_urls.length; i++) {
			mediaItem = itemDetails.media_urls[i];
			
			// Skip the non-image media content type (for example Openbeelden videos)
			if(['image/jpeg','image/jpg','image/gif','image/png'].indexOf(mediaItem.content_type) == -1){
				if(['video/mp4', 'video/ogg', 'video/webm'].indexOf(mediaItem.content_type) > -1){
					$scope.showPlayer = true;
					$scope.videosources.push(mediaItem);
				}
				continue;
			}				

			// Pick the 500px image (Beeldbank Nationaal Archief)
			if(mediaItem && mediaItem.width == 500){
				myMediaItem = mediaItem.url;
				break;
			}

			// or pick the last image left (for example Rijksmuseum, Openbeelden)
			myMediaItem = mediaItem.url;
			
		}
		$scope.imgurlref = myMediaItem;
		if(isQueryView){

			if($scope.$parent.thumbSizeSmall)
				$scope.imgurl = myMediaItem + '?size=small';
			else
				$scope.imgurl = myMediaItem + '?size=medium';

		}else {
			$scope.imgurl = myMediaItem
		}
	
	}]);

//this controller if for the detail view. 
OCDAppCtrl.controller('detailCtrl' , ['$scope', '$http','DetailService', '$window',
	function ($scope, $http, DetailService, $window) {
		var objectPromise = DetailService.getItem();

		//TODO: I shoudl not use a ng-repeat for a single item.
		$scope.results = [];
		objectPromise.then(function(data) {
			$scope.results.push(data.data);
			console.log(data.data);
		});

		//TODO: fix this hack with proper css
		$scope.maxHeight = window.innerHeight - 80;

		var w = angular.element($window);
		w.bind('resize', function () {
			$scope.maxHeight = window.innerHeight - 80;
		});
	}]);

//this controller controlls the leftbar .
OCDAppCtrl.controller('leftbarCtrl', ['$scope', 'QueryService', 'StateService', 'RightUrlService',
	function ($scope, QueryService, StateService, RightUrlService) {
		//get the data from the Queryservice
		var data = QueryService.getData();
		if(data){
			//array to hold all the filter button states. 
			$scope.filterResetButtonState = [];
			$scope.buttontext = [];

			$scope.source_id2 = QueryService.getFacet('source_id', true);
			$scope.source_id = QueryService.getSourceNames();
			setButtonText('source_id');

			

			$scope.author = QueryService.getFacet('author', false);
			setResetButtonState('author');

			//the rights are links.
			$scope.rights = RightUrlService.returnlinkArray(QueryService.getFacet('rights', false));
			setResetButtonState('rights');

			$scope.showValues = true;
			
			$scope.date = QueryService.getDateObject();
			//set the reset button state.
			if($scope.date && $scope.date.usermin == $scope.date.min && $scope.date.usermax == $scope.date.max)
				$scope.filterResetButtonState.date = true;
			else
				$scope.filterResetButtonState.date = false;
		}

		$scope.onHandleUp = function(){
			// if the user returns the handles to the max and min, reset filter.
			if($scope.date.usermin == $scope.date.min && $scope.date.usermax == $scope.date.max){
				QueryService.setFilterOption('date' , []);
				$scope.filterResetButtonState.date = true;
			}
			else{
				$scope.filterResetButtonState.date = false;
				QueryService.setFilterOption('date' , $scope.date );
			}
		};

		//switch between Rest and deselect all
		function setButtonText(facetname){
			var facet = $scope[facetname];
			if(!!facet){
				var setState = 'deselect all';
				var activecount = 0;
				for(var i = 0; i < facet.length; i++){
					if (facet[i].active)
						activecount++;
				}
				if(activecount <= facet.length/2)
					setState = 'reset';
				
				$scope.buttontext[facetname] = setState;
			}
		}

		//activate the reset button, if this filter is in the options.
		function setResetButtonState(facetname){
			if(QueryService.getFilterOption(facetname).length > 0)
				$scope.filterResetButtonState[facetname] = false;
			else
				$scope.filterResetButtonState[facetname] = true;
		}

		$scope.toggle = function(facetname){
			var facet = $scope[facetname];
			if(!!facet){
				var activecount = 0;
				for(var i = 0; i < facet.length; i++){
					if (facet[i].active)
						activecount++;
				}

				if(activecount <= facet.length/2){
					QueryService.setFilterOption(facetname, []);
					return;
				}

				var exclude = [];
				for(var i = 0; i < facet.length; i++){
					exclude.push(facet[i].name);
				}
				QueryService.setFilterOption(facetname, exclude);
			}
		};

		$scope.resetFilter = function(facetname){
			QueryService.setFilterOption(facetname, []);
		};

		$scope.updateExcludeList =  function(facetname){
			var facet = $scope[facetname];

			var exclude = [];
			for(var i = 0; i < facet.length; i++){
				if (!facet[i].active){
					if(facet[i].id)
						exclude.push(facet[i].id);
					else
						exclude.push(facet[i].name);
				}
					
			}
			QueryService.setFilterOption(facetname, exclude);
		};

		if(QueryService.getFilterOption('onlyvideo') == true){
			$scope.videofilter = true;
		}
		
		$scope.toggleVideo = function(){
			if($scope.videofilter){
				QueryService.setFilterOption('onlyvideo', true);
			}
			else {
				QueryService.setFilterOption('onlyvideo', []);
			}
		}
	}
	]);

//this controller controlls the navbar.
OCDAppCtrl.controller('NavBarCtrl', ['$scope', 'QueryService', '$location', 'StateService',
	function ($scope, QueryService, $location, StateService) {

		$scope.query = "";

		var data = QueryService.getData();
		$scope.query = data.query;

		$scope.sideBarOpen = StateService.sidebarOpen;
		
		$scope.onquerypage = (($location.$$path.split('/').indexOf("query") != -1)) ? true : false;

		//call the service and notify them of a new search query
		$scope.search = function(){
			QueryService.newSearchString($scope.query);
		};

		$scope.showsidebar = function (){
			StateService.sidebarOpen = (StateService.sidebarOpen) ? false : true;
			StateService.notifySidebarOpenobserverCallback();
		};

		$scope.suggest = function(){
			//TODO create suggest function.
			//console.log($scope.query);
		};
		
	}
	]);


OCDAppCtrl.controller('ErrorCtrl', ['$scope', function($scope) {

	$scope.currentError = "";

	$scope.clearError = function () {
		$scope.currentError = "";
	};

	$scope.$on('error', function(e, errorMessage) {
		$scope.currentError += errorMessage+ '\n' ;

	});

}]);