angular.module("viralitydiv", [])
	.factory('d3', function(){
		return d3;
	})
	.factory('factoryGetVirality', ['$http', function ($http) {
		return {
			getVirality: function (
				parameter_frequency,
				parameter_admindivlevel,
				parameter_year,
				parameter_month,
				parameter_day,
				parameter_topic,
				parameter_administrative_division_1,
				parameter_administrative_division_2,
				params,
				parameter_virality) {
					
					$("#modal_loading").modal('show');
					$(".slider-handle").hide();
					//$( ".monthSlider").slider("disable");

					$http({
						method: "GET",
						//url: "http://94.177.167.89:3000/restAPI/virality?type=" + parameter_virality + "&limit=3",
						url: "https://api.controlodio.it:4000/restAPI/virality?type=" + parameter_virality + "&limit=3",
						params: params
					})
					.then(function (data, status, headers) {

						//console.log("data: "+JSON.stringify(data[0].id));

						var data = data['data'].data;
						var counter = 0;

						var baseWidth = 260;

						//$('.grid-container').masonry( 'remove', $('.grid-container').find('.grid-item') );

						$(".grid-item").remove()
						if(data.length > 0){



							$(document).ready(function(){
								twttr.ready(
									function (twttr) {
										rayoutTimeline().then(function() {
//											$('.grid-container').masonry({
//													itemSelector: '.grid-item',
//													columnWidth: 280
//											});
											//var $div = '<span class="glyphicon glyphicon glyphicon-plus" data-tooltip="tooltip" title="Load More Tweets" id="more_tweet"></span>';
											//	$('.grid-container').append($div);
											for(var i = 0; i < data.length; i++) {
												var index = '#id' + i;
												var $item = $(index).get(0);
												$('.grid-container').masonry('appended', $item);
											}
											$('.grid-container').masonry('reloadItems');
											$('.grid-container').masonry('layout');
											$("#modal_loading").modal('hide');
											$(".slider-handle").show();
											//$( ".monthSlider").slider("enable");
											$('.grid-container').css("height", "63vh");
										});
									}
								);
							});
						}
						function rayoutTimeline() {
							var deferr = new $.Deferred;
							var $timeline = $('.grid-container');

							data.forEach( function(d,i) {

								if(data[i].id != undefined){
									var $grid = $('<div class="grid-item" id="id' + i + '">');
									$timeline.append($grid);
									$grid.attr('data-index', i);
									console.log("TWEET data[i].id: " + data[i].id);

									twttr.widgets.createTweet(
										data[i].id,
										$grid.get(0),
										{
											align: 'left',
											width: baseWidth,
											//cards: 'hidden',
											conversation: 'none'
										}
									)
									.then(function (el) {
										var $el = $(el);
										var $pl = $el.parent();
										var index = parseInt($pl.attr('data-index'));
										$el.css({'opacity': 1, 'transition-delay': (index/10) + 's'});
										counter++;
										if(counter === data.length) {
											return deferr.resolve();
										}
									});
								}
							});
							return deferr.promise();
						}


						return 1;
					}, function myError(error) {
						console.log("Error")
						return 0;
					});
			},
			addVirality: function (
				parameter_frequency,
				parameter_admindivlevel,
				parameter_year,
				parameter_month,
				parameter_day,
				parameter_topic,
				parameter_administrative_division_1,
				parameter_administrative_division_2,
				params,
				parameter_virality,
				max) {


					var limit = max + 3;
					$("#modal_loading").modal('show');
					$(".slider-handle").hide();
					//$( ".monthSlider").slider("disable");

					//CONTROLLO LIMIT < 9
					$http({
						method: "GET",
						url: "https://api.controlodio.it:4000/restAPI/virality?type=" + parameter_virality + "&limit=" + limit,
						//url: "http://94.177.167.89:3000/restAPI/virality?type=" + parameter_virality + "&limit=" + limit,
						params: params
					})
					.then(function (data, status, headers) {

						//console.log("data: "+JSON.stringify(data[0].id));

						var data = data['data'].data;
						var counter = 0;
						var baseWidth = 250;

						if(data.length > 0){
							$(document).ready(function(){
								twttr.ready(
									function (twttr) {
										rayoutTimeline().then(function() {

											for(var i = max; i < limit; i++) {
												var index = '#id' + i;
												var $item = $(index).get(0);
												$('.grid-container').masonry('appended', $item);
											}
											$('.grid-container').masonry('reloadItems');
											$('.grid-container').masonry('layout');
											$("#modal_loading").modal('hide');
											$(".slider-handle").show();
											//$( ".monthSlider").slider("enable")
											$('.grid-container').css("height", "63vh");
										});
									}
								);
							});
						}

						function rayoutTimeline() {
							var deferr = new $.Deferred;
							var $timeline = $('.grid-container');

							data.forEach( function(d,i) {

								if(data[i].id != undefined && i >= max){

									var $grid = $('<div class="grid-item" id="id' + i + '">');
									$timeline.append($grid);
									$grid.attr('data-index', i);

									twttr.widgets.createTweet(
										data[i].id,
										$grid.get(0),
										{
											align: 'left',
											width: baseWidth,
											//cards: 'hidden',
											conversation: 'none'
										}
									)
									.then(function (el) {
										var $el = $(el);
										var $pl = $el.parent();
										var index = parseInt($pl.attr('data-index'));
										$el.css({'opacity': 1, 'transition-delay': (index/10) + 's'});
										counter++;
										if(counter === 2) {
											return deferr.resolve();
										}
									});
								}
							});
							return deferr.promise();
						}

						return 1;
					}, function myError(error) {
						console.log("Error");
						return 0;
					});
			}
		}
	}])
	.directive('viralitydiv', ["d3","factoryGetVirality", function(d3, factoryGetVirality) {
		return {
			restrict: 'E',
			scope: {
				parameterFrequency:'@',
				parameterYear:'@',
				parameterMonth:'@',
				parameterDay:'@',
				parameterTopic:'@',
				parameterAdministrativeDivision1:'@',
				parameterAdministrativeDivision2:'@',
				parameterAdmindivlevel: '@',
				parameterSlider:'@',
				parameterVirality:'@'
			},
			transclude: true,
			link: function ($scope, $element, $attrs) {

				function calc_params(){
					var params = {};
					if ($scope.parameterTopic != undefined) params['topic'] = $scope.parameterTopic;

					var lastday = function(y, m){
						return  new Date(y, m, 0).getDate();
					}

					if ($scope.parameterFrequency != undefined) {
						if($scope.parameterFrequency == 0){
							params['startdate'] = "1/1/"+$scope.parameterYear;
							params['enddate'] = "31/12/"+$scope.parameterYear;
						}
						else if($scope.parameterFrequency == 1) {
							var day = lastday($scope.parameterYear, $scope.parameterMonth);
							params['startdate'] = "1/" + $scope.parameterMonth + "/"+$scope.parameterYear;
							params['enddate'] = day + "/" + $scope.parameterMonth + "/"+$scope.parameterYear;
						}
						else {
							params['startdate'] = $scope.parameterDay + "/" + $scope.parameterMonth + "/"+$scope.parameterYear;
							params['enddate'] = $scope.parameterDay + "/" + $scope.parameterMonth + "/"+$scope.parameterYear;
						}
					};
					return params;
				}

				$('.grid-container').masonry({
						itemSelector: '.grid-item',
						columnWidth: 280
				});

				$(document).ready(function() {

					$(".tweets-virality").click(function(){
						$scope.parameterVirality = $(this).attr("value");

						d3.selectAll(".tweet-span").attr("class", "tweet-span-2");

						var id = "#span-tweet-"+$(this).attr("value");
						d3.selectAll(id).attr("class", "tweet-span").style("opacity", 1);
						d3.selectAll(".tweet-span-2").style("opacity",0.7);

						$scope.$apply();
					});

				});

				$('#more_tweet').click(
					function(){
						var params = calc_params();
						var max = $(".grid-item").length;
						factoryGetVirality.addVirality(
							$scope.parameterFrequency,
							$scope.parameterAdmindivlevel,
							$scope.parameterYear,
							$scope.parameterMonth,
							$scope.parameterDay,
							$scope.parameterTopic,
							$scope.parameterAdministrativeDivision1,
							$scope.parameterAdministrativeDivision2,
							params,
							$scope.parameterVirality,
							max
						);
						return 0;
					}
				);

				$('#myCarousel').bind('slid.bs.carousel', function (e) {

					if($("#myCarousel").find(".item.active").attr('id') === "svg-container-3"){
						console.log("TWEET-tab");

//						for(var i = 0; i < $(".grid-item").length; i++) {
//							var $item = $(".grid-item")[i];
//							$('.grid-container').masonry('remove', $item);
//						}

						$(".grid-item").remove();
						var params = calc_params();
						factoryGetVirality.getVirality(
							$scope.parameterFrequency,
							$scope.parameterAdmindivlevel,
							$scope.parameterYear,
							$scope.parameterMonth,
							$scope.parameterDay,
							$scope.parameterTopic,
							$scope.parameterAdministrativeDivision1,
							$scope.parameterAdministrativeDivision2,
							params,
							$scope.parameterVirality
						);
					}
				});

 				$scope.$watch('' + '[parameterYear,' + 'parameterVirality,' + 'parameterMonth,' + 'parameterDay,' + 'parameterTopic,' + 'parameterFrequency,' + 'parameterTopic' + ']', function($newVal, $oldVal, $scope) {

 					if($("#svg-container-3.item.active").length > 0) {

	 					var params = calc_params();
						factoryGetVirality.getVirality(
							$scope.parameterFrequency,
							$scope.parameterAdmindivlevel,
							$scope.parameterYear,
							$scope.parameterMonth,
							$scope.parameterDay,
							$scope.parameterTopic,
							$scope.parameterAdministrativeDivision1,
							$scope.parameterAdministrativeDivision2,
							params,
							$scope.parameterVirality
						);
 					}
	
				}, true);
			}
		}
	}]);