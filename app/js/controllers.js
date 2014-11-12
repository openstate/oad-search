var OCDAppCtrl = angular.module('OCDAppControllers', ['OCDAppServices']);

//this controlls the query screen
OCDAppCtrl.controller('queryCtrl', ['$scope', 'QueryService',
	function ($scope, QueryService) {
	
		//get the data from the Queryservice
		data = QueryService.getData();
		console.log(data);
		
		$scope.facets = data.queryData.facets.collection.terms;
		$scope.results =  data.queryData.results;

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


		//ask the service to move to a new page.
		$scope.moveToPage = function(){
			QueryService.moveToPage(this.page.pagenum);
		};

	}]);

//this controller parses all the itemdetail data. 
OCDAppCtrl.controller('ItemCtrl', ['$scope',
	function ($scope) {
		//add the needed variables to the scope.
		$scope.apiId = $scope.item._id || "";
		var itemsource = $scope.item._source;

		$scope.title = itemsource.title || "Title unknown";
		$scope.author = itemsource.authors && itemsource.authors[0] || "Author unknown";
		$scope.collection = itemsource.meta.collection || "Collection unknown";
		$scope.originalCollectionUrl = itemsource.meta.original_object_urls.html || "";
		$scope.apiUrl = itemsource.meta.ocd_url || "";
		$scope.rights = itemsource.meta.rights || "";
		
		//show the datestamp as full year.	
		if(itemsource.date){
			var d = new Date(itemsource.date);
			$scope.date = d.getFullYear();
		}
		
		//resolve the image.
		for (var i = 0; i < itemsource.media_urls.length; i++) {
			var media_item = itemsource.media_urls[i];
			
			// Skip the non-image media urls (for example Openbeelden videos)
			if(['image/jpeg','image/jpg','image/gif','image/png'].indexOf(media_item.content_type) == -1)
				continue;

			// Pick the 500px image (Beeldbank Nationaal Archief)
			if(media_item && media_item.width == 500){
				$scope.imgurl = media_item.url;
				break;
			}

			// or pick the last image left (for example Rijksmuseum, Openbeelden)
			$scope.imgurl = media_item.url;
		}
	}]);

//this controller controlls the navbar.
OCDAppCtrl.controller('NavBarCtrl', ['$scope', '$location', 'QueryService',
	function ($scope, $location, QueryService) {

		$scope.query = "";

		//the Navbar renders a before the router, so it needs to listen for a new query.
		//if QueryService broadcasts a new query, update the query in the navbar
		$scope.$on('New Query', function (event, data) {
			$scope.query = data.query;
		});

		//change the url to represent new seach. Remove options and set page back to one.
		$scope.search = function(){
			$location.path( 'query/'+$scope.query+'/page/1' );
		};


		$scope.suggest = function(){
			//TODO create suggest function.
			//console.log($scope.query);
		};
		
	}
	]);


