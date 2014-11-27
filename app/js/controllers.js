var OCDAppCtrl = angular.module('OCDAppControllers', ['OCDAppServices']);

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
			//build a array of options for the paginator.
			var start_pagination = ((Math.ceil(data.page / 6) - 1) * 6) + 1;
			var end_pagination = start_pagination + 5;

			if (end_pagination > data.queryData.pages) {
				end_pagination = data.queryData.pages;
			}

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

//this controller parses all the itemdetail data. 
OCDAppCtrl.controller('ItemCtrl' , ['$scope', '$http',
	function ($scope, $http) {
		//add the needed variables to the scope.
		$scope.apiId = $scope.item._id || "";
		var itemsource = $scope.item._source;

		$scope.title = itemsource.title || "Title unknown";

		$scope.author = itemsource.authors && itemsource.authors[0] || "Author unknown";
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
			
			// Skip the non-image media urls (for example Openbeelden videos)
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
		// We use this as a temporary solution to get smaller sized images from Rijksmuseum
		if(itemsource.meta.collection == "Rijksmuseum"){
			$http.get('php/resolve_rijks_url.php', {params:{url:myMediaItem}}).success(function(data) {

				if(data.error){
					console.log("phperror");
					console.log(data.error);
					alert("Error: php-failed");
					queryData = false;
					return;
				}

				$scope.imgurlref = myMediaItem;
				$scope.imgurl = data.url.replace('%3Ds0', '=s450');
			});
		}else{
			$scope.imgurlref = myMediaItem;
			$scope.imgurl = myMediaItem;
		}
	}]);

//this controller controlls the leftbar .
OCDAppCtrl.controller('leftbarCtrl', ['$scope', 'QueryService',
	function ($scope, QueryService) {
		//get the data from the Queryservice
		var data = QueryService.getData();
		if(data){
			$scope.buttonstate = [];
			$scope.buttontext = [];

			$scope.collection = QueryService.getFacet('collection', true);
			setButtonText('collection');

			$scope.author = QueryService.getFacet('author', false);
			setButtonState('author');

			$scope.rights = QueryService.getFacet('rights', false);
			setButtonState('rights');
			
			$scope.showValues = true;
			
			$scope.date = QueryService.getDateObject();
			if($scope.date && $scope.date.usermin == $scope.date.min && $scope.date.usermax == $scope.date.max)
				$scope.buttonstate.date = true;
			else
				$scope.buttonstate.date = false;
		}

		$scope.onHandleUp = function(){
			console.log('fireonhandle');
			
			if($scope.date.usermin == $scope.date.min && $scope.date.usermax == $scope.date.max){
				QueryService.setFilterOption('date' , []);
				$scope.buttonstate.date = true;
			}
			else{
				$scope.buttonstate.date = false;
				QueryService.setFilterOption('date' , {
					usermin:$scope.date.usermin,
					usermax:$scope.date.usermax
				});
			}
		};

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

		function setButtonState(facetname){
			if(QueryService.getFilterOption(facetname).length > 0)
				$scope.buttonstate[facetname] = false;
			else
				$scope.buttonstate[facetname] = true;
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
			console.log(exclude);
			QueryService.setFilterOption(facetname, exclude);

		};
	}
	]);

//this controller controlls the navbar.
OCDAppCtrl.controller('NavBarCtrl', ['$scope', 'QueryService',
	function ($scope, QueryService) {

		$scope.query = "";

		//the Navbar renders a before the router, so it needs to listen for a new query.
		//if QueryService broadcasts a new query, update the query in the navbar
		$scope.$on('New Query', function (event, data) {
			$scope.query = data.query;
		});

		//call the service and notify them of a new search query
		$scope.search = function(){
			QueryService.newSearchString($scope.query);
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