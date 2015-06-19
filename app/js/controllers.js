var OCDAppCtrl = angular.module('OCDAppControllers', ['OCDAppServices']);

//this controler controlls the home screen
OCDAppCtrl.controller('homeCtrl', ['$scope', 'QueryService', 'JsonService', '$q',
	function ($scope, QueryService, JsonService, $q) {
		
		QueryService.clearQuery();
		QueryService.clearFilterOptions();

		$('#myCarousel a').click(function(event){
			event.preventDefault();
		})

		$scope.isActive = function(index) {
			if(index == 0)
				return 'active';
		}

		var sourcePromise = QueryService.getSources();
		var museaPromise = JsonService.getMusea();
		//var Musea = 
		//};
	
		$scope.carousel = [];

		//temp solution, changed if a better option is available.
		$q.all([sourcePromise, museaPromise]).then(function(data){
			console.log(data);
			var terms = data[0].sources;
			var Musea = data[1].data;
			for(var i = 0; i < terms.length; i++ ){
				if(Musea[terms[i].name]){
					Musea[terms[i].name].count = terms[i].count;
				}
			}

			var i = -1;
			var j = -1;
			for (var key in Musea) {
				var num = ++i;
				if((num % 4) === 0 ){
					$scope.carousel[++j] = [];
				}
				var obj = Musea[key];
				obj.name = key;
				$scope.carousel[j].push(obj);
			}
			
			$('.carousel').carousel({
				interval: 2800
			})
			
		});

		//get the first restult of six example query's. 
		var examplequeries = ["Rembrandt olieverf", "polygoon", "schotel","Stilleven met bloemen","Rotterdam", "kust"];
		
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
			if($('.row-offcanvas.active').length > 0)
			{
				StateService.sidebarOpen = false;
				$('.row-offcanvas').toggleClass('active');
			}
			
		}

		$scope.openMenu = function(){
			if($('.row-offcanvas.active').length === 0){
				StateService.sidebarOpen = true;
				$('.row-offcanvas').toggleClass('active');
			}
		}
		//get the data from the Queryservice
		data = QueryService.getData();
		console.log(data);
		if(data){
			$scope.results =  data.queryData.results;
			updatepaginator();
		}

		function updatepaginator(){

			if(data.queryData.pages < 2){
				$scope.paginator = false;
				return;
			}
			
			var start_pagination = ((Math.ceil(data.page / 6) - 1) * 6) + 1;
			var end_pagination = start_pagination + 5;

			if (end_pagination > data.queryData.pages) {
				end_pagination = data.queryData.pages;
			}

			//build a array for the paginator.
			var pagelist = [{
				class: (start_pagination == 1) ? "disabled" : "",
				pagenum: start_pagination - 1,
				text:"<<"
			}];
			
			for(var i = start_pagination; i <= end_pagination; i++){
				pagelist.push({
					class: (data.page == i) ? "active" : "",
					pagenum:i,
					text:i
				});
			}

			pagelist.push({
				class: (end_pagination == data.queryData.pages) ? "disabled" : "",
				pagenum:end_pagination + 1,
				text:">>"
			});

			$scope.paginator = pagelist;
		}


		//ask the service to move to a new page.
		$scope.moveToPage = function(){
			var pagenum = this.page.pagenum;
			
			//to make the interface responsive, update the paginator instantly
			data.page = pagenum;
			updatepaginator();

			QueryService.moveToPage(pagenum);
		};

		$scope.showsidebar = function (){
			if($('.row-offcanvas.active').length === 0)
				StateService.sidebarOpen = true;
			else
				StateService.sidebarOpen = false;

			$('.row-offcanvas').toggleClass('active');
		};

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

			$scope.collection = QueryService.getFacet('collection', true);
			setButtonText('collection');

			$scope.author = QueryService.getFacet('author', false);
			setResetButtonState('author');

			//the rights are links.
			$scope.rights = RightUrlService.returnlinkArray(QueryService.getFacet('rights', false));
			setResetButtonState('rights');

			if(StateService.sidebarOpen === true)
				$('.row-offcanvas').toggleClass('active');
			
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
			//var selected = this.facet;
			var facet = $scope[facetname];

			var exclude = [];
			for(var i = 0; i < facet.length; i++){
				if (!facet[i].active)
					exclude.push(facet[i].name);
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

		if($location.$$path.substring(0,6) == "/query")
			$scope.onquerypage = true;
		else
			$scope.onquerypage = false;

		//call the service and notify them of a new search query
		$scope.search = function(){
			QueryService.newSearchString($scope.query);
		};

		$scope.showsidebar = function (){
			if($('.row-offcanvas.active').length === 0)
				StateService.sidebarOpen = true;
			else
				StateService.sidebarOpen = false;

			$('.row-offcanvas').toggleClass('active');
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