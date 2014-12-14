var OCDAppCtrl = angular.module('OCDAppControllers', ['OCDAppServices']);

//this controler controlls the home screen
OCDAppCtrl.controller('homeCtrl', ['$scope', 'QueryService', '$location',
	function ($scope, QueryService) {
		
		QueryService.clearQuery();

		//temp solution, changed if a better option is available.
		QueryService.simplehttpGet("de || het || een").then(function(data){
			$scope.sourcelist = data.facets.collection.terms;
		});

		//get the first restult of six example query's. 
		var examplequeries = ["Rembrandt", "De ark van Noach", "schotel","Stilleven met bloemen","Rotterdam","van Gogh"];
		
		$scope.examplelist = [];
		for(var i=0; i < examplequeries.length; i++){
			QueryService.simplehttpGet(examplequeries[i])
			.then(function(data){
				$scope.examplelist.push({
					title:data.query,
					firstresult:[data.results[0]]
				});
			});
		}

		$scope.goToQuery = function(){
			QueryService.newSearchString(this.item.title);
		};

	}]);

//this controlls the query screen
OCDAppCtrl.controller('queryCtrl', ['$scope', 'QueryService',
	function ($scope, QueryService) {


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

	}]);

//this controller parses all the item detail data. 
OCDAppCtrl.controller('ItemCtrl' , ['$scope', '$http',
	function ($scope, $http) {
	
		//add the needed variables to the scope.
		$scope.apiId = $scope.item._id || "";
		var itemsource = $scope.item._source;
		$scope.title = itemsource.title || "Title unknown";

		//show the first author
		$scope.author = itemsource.authors && itemsource.authors[0] || "Author unknown";
		
		//if more authors, show the three dots and add title text.
		if(itemsource.authors && itemsource.authors.length > 1) {
			$scope.authorhooverindicate = "...";
			
			var hoovertext = "";
			for(var i = 0; i < itemsource.authors.length; i++) {
				hoovertext += itemsource.authors[i] + ' / ';
			}
			
			$scope.authorhoover = hoovertext.slice(0,-3);

		}

		$scope.collection = itemsource.meta.collection || "Collection unknown";
		$scope.originalCollectionUrl = itemsource.meta.original_object_urls.html || "";
		$scope.apiUrl = itemsource.meta.ocd_url || "";
		$scope.rights = itemsource.meta.rights || "";
		
		//show the datestamp as full year.	
		if(itemsource.date){
			var d = new Date(itemsource.date);
			$scope.date = d.getFullYear();
		}


		var myMediaItem;
		//resolve the image.
		for (var i = 0; i < itemsource.media_urls.length; i++) {
			mediaItem = itemsource.media_urls[i];
			
			// Skip the non-image media content type (for example Openbeelden videos)
			if(['image/jpeg','image/jpg','image/gif','image/png'].indexOf(mediaItem.content_type) == -1)
				continue;

			// Pick the 500px image (Beeldbank Nationaal Archief)
			if(mediaItem && mediaItem.width == 500){
				myMediaItem = mediaItem.url;
				break;
			}

			// or pick the last image left (for example Rijksmuseum, Openbeelden)
			myMediaItem = mediaItem.url;

		}
		
		//get redirect location of the OpenCultuurData Resolver URLs
		//We use this as a temporary solution to get smaller sized images from Rijksmuseum
		if(itemsource.meta.collection == "Rijksmuseum"){
			$http.get('php/resolve_rijks_url.php', {params:{url:myMediaItem}}).success(function(data) {

				if(data.error){
					console.log("phperror");
					console.log(data.error);
					alert("Error: php-failed");
					queryData = false;
					return;
				}

				//the link should go to the full size image, the thumbnail should have the smaller img.
				$scope.imgurlref = myMediaItem;
				$scope.imgurl = data.url.replace('%3Ds0', '=s450');
			});
		}else{
			$scope.imgurlref = myMediaItem;
			$scope.imgurl = myMediaItem;
		}
	}]);

//this controller controlls the leftbar .
OCDAppCtrl.controller('leftbarCtrl', ['$scope', 'QueryService', 'StateService',
	function ($scope, QueryService, StateService) {
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

			$scope.rights = QueryService.getFacet('rights', false);
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

	$scope.currentError = null;

	$scope.clearError = function () {
		$scope.currentError = null;
	};

	$scope.$on('error', function(e, errorMessage) {
		$scope.currentError = errorMessage;
	});

}]);