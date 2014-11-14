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
		data = QueryService.getData();
		
		$scope.collections = {};

		if(data){
			$scope.collections = data.queryData.collections;
			$scope.facets = data.queryData.facets.collection.terms;
			var daterange = data.queryData.facets.date.entries;
			var firstdate = new Date(daterange[0].time);
			var lastdate = new Date(daterange[daterange.length - 1].time);
			console.log(firstdate);
			console.log(lastdate);
		}

		$scope.changeList =  function(){
			var exclude = [];
			for(var collectionkey in $scope.collections){
				if(!$scope.collections[collectionkey])
					exclude.push(collectionkey);
			}
			console.log(exclude);

			QueryService.updateCollections(exclude);

			
		};
	}
	]);

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


