angular.module("slider_module", [])
	.factory('d3', function(){
		return d3;
	})
	.factory('factoryGetPercentageLine', ['$http', function ($http) {
	return {
		getPercentage: function (
			line_chart,
			parameter_frequency,
			parameter_year,
			parameter_month,
			parameter_day,
			parameter_topic,
			parameter_months_name,
			parameter_actual_array_date,
			parameter_admin_div_level,
			parameter_mobile )
			{
				var params = {};
				var date_identifier = "";

				var lastday = function(y, m){
					return  new Date(y, m, 0).getDate();
				}

				if($("#myCarousel").find(".item.active").attr('id') === "svg-container-2") {
					if(parameter_admin_div_level == 1) params['is_administrative_division_1'] = "true";
						else if (parameter_admin_div_level == 2) params['is_administrative_division_2'] = "true";
						else params['is_administrative_division_0'] = "true";
					if (parameter_topic != '') params['topic'] = parameter_topic;
				} else if ($("#myCarousel").find(".item.active").attr('id') === "svg-container-3"){
					if (parameter_topic != '') params['topic'] = parameter_topic;
				} else {
					params['topic'] = 'all';
				}

				if (parameter_mobile) {
					params['frequency'] = "daily";
					var d = new Date();
					d.setDate(d.getDate() - 1);

					var MyDateString = ('0' + d.getDate()).slice(-2) + '/'
					+ ('0' + (d.getMonth()+1)).slice(-2) + '/'
					+ d.getFullYear();

					params['startdate'] = MyDateString;
					params['enddate'] = MyDateString;
					$("#span-month-container").show();
					$("#span-day-container").show();
					$("#well-temporal-slider").hide();
					$("#modal_mobile_adv").modal('show');

				} else {
					if(parameter_frequency == 0){
						params['frequency'] = "annually";
						date_identifier = "year";
						params['startdate'] = "01/10/2018";
						var currentTime = new Date();
						params['enddate'] = "31/12/" + currentTime.getFullYear();
					} else if(parameter_frequency == 1) {
						params['frequency'] = "monthly";
						date_identifier = "month";
						if(parameter_year == 2018) params['startdate'] = "1/10/" + parameter_year;
						else params['startdate'] = "1/1/" + parameter_year;
						params['enddate'] = "31/12/" + parameter_year;
					} else {
						params['frequency'] = "daily";
						date_identifier = "day";
						params['startdate'] = "1/" + parameter_month + "/" + parameter_year;
						var day = lastday(parameter_year, parameter_month);
						params['enddate'] = day + "/" + parameter_month + "/" + parameter_year;
					}
				}

				$("#modal_loading").modal('show');

				return $http({
					method: "GET",
					//url: "http://94.177.167.89:3000/restAPI/timeFrequency?attribute=hs",
					url: "https://api.controlodio.it:4000/restAPI/timeFrequency?attribute=hs",
					params: params
				})
				.then(function (data, status, headers, config) {

					$("#modal_loading").modal('hide');

					var height = $(".slider-horizontal").height() * 2.5;
					var width_slider = parseInt($( ".slider-horizontal" ).width());

					var x = d3.scalePoint().range([0, width_slider]);
					var y = d3.scaleLinear().range([height, 7]);

					var data = data['data'].data;

					$('.monthSlider').data('slider').options.max = data.length;

					var valueline = d3.line()
						.x(function(d) { return x(d[date_identifier]); })
						.y(function(d) { return y(d.count); })
						.curve(d3.curveCatmullRom);

					var area = d3.area()
						.x(function(d) { return x(d[date_identifier]); })
						.y0(height)
						.y1(function(d) { return y(d.count); })
						.curve(d3.curveCatmullRom);

					var valueline2 = d3.line()
						.x(function(d) { return x(d[date_identifier]); })
						.y(function(d) { return y(d.yes); })
						.curve(d3.curveCatmullRom);

					var area2 = d3.area()
						.x(function(d) { return x(d[date_identifier]); })
						.y0(height)
						.y1(function(d) { return y(d.yes); })
						.curve(d3.curveCatmullRom);


					x.domain(data.map(function(d) { return d[date_identifier]; }));
					y.domain([0, d3.max(data, function(d) { return d.count; })]);


					d3.select("#temporal-slider-svg").select(".line1")
						.transition()
						.duration(750)
						.attr("d", valueline(data));
					d3.select("#temporal-slider-svg").select(".area1")
						.transition()
						.duration(750)
						.attr("d", area(data));

					d3.select("#temporal-slider-svg").select(".line2")
						.transition()
						.duration(750)
						.attr("d", valueline2(data));
					d3.select("#temporal-slider-svg").select(".area2")
						.transition()
						.duration(750)
						.attr("d", area2(data));

					d3.select("#temporal-slider-svg").selectAll(".linesLine_chart")
						.remove();

					d3.select("#temporal-slider-svg").selectAll(".linesLine_chart")
						.data(data)
						.enter().append("line")
						.attr("x1",function(d) { return x(d[date_identifier]); })
						.attr("x2",function(d) { return x(d[date_identifier]); })
						.attr("y2", height)
						.attr("y1",function(d) {
							var top = d.count;
							return y(top);
						})
						.style("stroke-width","1px")
						.style("stroke","#161616")
						.attr("class","linesLine_chart");

					if(parameter_frequency == 1) {
						var labels = [];
						data.forEach(function(d){
							var index = parseInt(d[date_identifier])-1;
							labels.push(parameter_months_name[index]);
						});
						var xAxis = d3.axisBottom(x).tickSize(0).tickFormat(function(d,i){ return labels[i] });
					} else {
						var xAxis = d3.axisBottom(x).tickSize(0).ticks(data.length)
					};

					d3.select("#temporal-slider-svg").select(".x.axis")
						.call(xAxis);
					
					d3.select("#temporal-slider-svg")
						.select(".x.axis")
						.selectAll("text")
						.each(
							function(d,i){
								if (data.length == 1) {
									var xTra = $("#temporal-slider-svg").width() / 2;
									d3.select(this).attr("transform", "translate(-"+xTra+", 5)");
									d3.select("#temporal-slider-svg").selectAll(".linesLine_chart").attr("transform", "translate(-"+xTra+", 5)");
									d3.select(this).style("text-anchor", "start");
								} else {
									d3.select(this).attr("transform", "translate(0, 5)").style("fill", "gray");//.style("fill","#bfbfbf");
									if(i == 0) d3.select(this).style("text-anchor", "start");
									else if(i == data.length - 1) d3.select(this).style("text-anchor", "end");
									else d3.select(this).style("text-anchor", "middle");
								}
							}
						);
					return data;
				}, function myError(response) {
					//d3.select(element).attr("fill", "grey");
					return 0;
				});
			}
		}
	}])
	.directive('sliderdir', ["factoryGetPercentageLine", "$http", function(factoryGetPercentageLine, $http){
		return {
			restrict: "E",
			scope: {
				slider: "=",
				parameterFrequency:'=',
				parameterAdmindivlevel:'=',
				parameterYear:'=',
				parameterMonth:'=',
				parameterMonthsName:'=',
				parameterDay:'=',
				parameterTopic:'=',
				parameterActualArrayDate:'=',
				parameterMobile:'=',
				parameterView:'='
			},
			transclude: true,
			link: function($scope, iElm, iAttrs, controller) {

				$(function(){
				 	window.onorientationchange = OrientationChanged;
				 });

				function OrientationChanged(e){
					location.reload(true);
					//if(window.orientation == 90) console.log("90");
				}

				function manage_url_carousel(){
					var url = document.location.toString();

					if (url.match('#view=')) {
						// Clear active item
						$('#myCarousel .item.active').removeClass('active');
						$('#myCarousel-info .item.active').removeClass('active');
						
						// Activate item number #hash
						// var index = url.split('#view=')[1];
						var index = url.match(/#view=(\w+)/)[1];
						$scope.parameterView = index;
						$scope.$apply();
						$('#myCarousel .item[data-name="' + index + '"]').addClass('active');
						$('#myCarousel-info .item[data-name="' + index + '"]').addClass('active');
					}
				}

				function update_url(){
					if ($scope.parameterFrequency == 2){
						window.location.hash = "#view=" + $scope.parameterView + "#day=" + $scope.parameterDay + "#month=" + $scope.parameterMonth + "#year=" + $scope.parameterYear + "#target=" + $scope.parameterTopic;
					}
					else if ($scope.parameterFrequency == 1){
						window.location.hash = "#view=" + $scope.parameterView + "#month=" + $scope.parameterMonth + "#year=" + $scope.parameterYear + "#target=" + $scope.parameterTopic;
					}
					else{
						window.location.hash = "#view=" + $scope.parameterView + "#year=" + $scope.parameterYear + "#target=" + $scope.parameterTopic;
					}
				}

				function update_targets(input_click){
					$scope.parameterTopic = input_click;

					var url = window.location.hash;
					var rep = "#target="
					rep += url.match(/#target=(\w+)/)[1];
					var sub = "#target="+input_click;

					window.location.hash = url.replace(rep, sub);

					d3.selectAll(".span-targets").attr("class", "span-targets-2");

					var id = "#span-targets-"+input_click;
					d3.selectAll(id).attr("class", "span-targets").style("opacity", 1);
					d3.selectAll(".span-targets-2").style("opacity",0.45);

					$scope.$applyAsync();
				}

				var date_identifier = "year";

				var line_chart = function(){

					var mySlider = $(".monthSlider").slider({
						tooltip: "hide",
						selection: "none",
						min: 1,
						max: 30,
						step: 1,
						value: 1
					});

					$(".slider-handle").append(
						function(){
							return '<span id="explore-image" class="glyphicon glyphicon-zoom-in"></span>'
						}
					);
					$(".slider-handle").append(
						function(){
							return '<span class="glyphicon glyphicon-zoom-out" data-tooltip="tooltip" title="Previous" ></span>'
						}
					);

					$("#explore-image").attr('title',"Click to explore").attr("data-tooltip","tooltip");
					$("#explore-image").tooltip('hide')
						.tooltip('fixTitle')
						.tooltip('show');

					$(".glyphicon-pis").attr('title',"Click to go back").attr("data-tooltip","tooltip").attr("data-placement", "bottom");
					$(".glyphicon-zoom-out").tooltip('hide')
						.tooltip('fixTitle');

					var svg = d3.select("#temporal-slider-svg");

					var width = $(".slider-horizontal").width();
					var height = $(".slider-horizontal").height();// * 2.5;

					d3.select("#temporal-slider-svg")
						.attr("viewBox",
								function(){
									return "0 0 " + width + " " + height;
								}
							)
						.attr("preserveAspectRatio", "xMinYMin meet");

					var params = {};

					if ($scope.parameterTopic != '') params['topic'] = $scope.parameterTopic;

					function starting_params() {
						console.log("starting params")
						params['frequency'] = "annually";
						params['startdate'] = "1/10/2018";
						var currentTime = new Date();
						params['enddate'] = "31/12/" + currentTime.getFullYear();
					}
					if(WURFL.form_factor == "Tablet"){
						$("body").css("overflow", "auto");
					}

					if (/iPhone|Android/i.test(navigator.userAgent)) {

						$("body").css("overflow", "auto");
						$scope.parameterMobile = true;
						params['frequency'] = "daily";
						var d = new Date();
						d.setDate(d.getDate() - 1);

						var MyDateString = ('0' + d.getDate()).slice(-2) + '/'
						+ ('0' + (d.getMonth()+1)).slice(-2) + '/'
						+ d.getFullYear();

						params['startdate'] = MyDateString;
						params['enddate'] = MyDateString;

						$scope.parameterYear = d.getFullYear();
						$scope.parameterMonth = d.getMonth() + 1;
						$scope.parameterDay = d.getDate();
						$scope.parameterFrequency = 2;
					} else {
						var url = document.location.toString();
						if(url.match(/#user=(\w+)/)) {

							function validPeriod(start, end, date_input) {
								var valid = false;

								start = new Date(start);
								end = new Date(end);
								date_input = new Date(date_input);
								
								if(date_input < start || date_input > end || date_input == "Invalid Date") valid = true;
								return valid;

								// return (date_input > start && date_input < end) ? true : false;
							}

							if(url.match(/#year=(\w+)/)) {

								var start = "10/01/2018";
								var end = new Date();

								if(url.match(/#target=(\w+)/)){
									if(url.match(/#target=(\w+)/)[1] == "all" || url.match(/#target=(\w+)/)[1] == "roma" || url.match(/#target=(\w+)/)[1] == "etnichs_group" || url.match(/#target=(\w+)/)[1] == "religion")
										update_targets(url.match(/#target=(\w+)/)[1]);
								}

								if(url.match(/#month=(\w+)/)) {

									var year = url.match(/#year=(\w+)/)[1];
									var month = url.match(/#month=(\w+)/)[1];

									var date_input = month + "/1/" + year;

									if(validPeriod(start, end, date_input)) {
										starting_params();
									} else {
										$("#explore-image").tooltip('hide')
											.tooltip('fixTitle');

										var input_day = 1;

										if(url.match(/#day=(\w+)/)) {
											input_day = url.match(/#day=(\w+)/)[1];
										}

										$scope.parameterYear = year;
										$scope.parameterMonth = month;
										$scope.parameterDay = input_day;
										$scope.parameterFrequency = 2;

										params['frequency'] = "daily";

										var lastday = function(y, m){
											return new Date(y, m, 0).getDate();
										}
										var day = lastday(year, month);


										params['startdate'] = "1/" + month + "/" + year;
										params['enddate'] = day + "/" + month + "/" + year;

										$("#span-month-container").show();
										$("#span-day-container").show();

										$scope.$applyAsync();
									}
								} else {
									var year = url.match(/#year=(\w+)/)[1];
									var date_input = "01/01/" + year;

									if(validPeriod(start, end, date_input)) {
										starting_params();
									} else {
										$scope.parameterYear = year;
										$scope.parameterFrequency = 1;

										params['frequency'] = "monthly";
										if(year == 2018) params['startdate'] = "1/10/2018";
										else params['startdate'] = "1/1/" + year;

										var currentTime = new Date();
										params['enddate'] = "31/12/" + currentTime.getFullYear();

										$("#span-month-container").show();

										$scope.$applyAsync();
									}
								}
							}				
						} else {
							starting_params();
						}
					}

					mySlider.bind("change", function(event){
						if ($scope.parameterFrequency == 0) {
							$scope.parameterYear = $scope.parameterActualArrayDate[$('.monthSlider').slider("getValue")-1];
							window.location.hash = "#view=" + $scope.parameterView + "#year=" + $scope.parameterYear + "#target=" + $scope.parameterTopic;
						} else if ($scope.parameterFrequency == 1) {
							$scope.parameterMonth = $scope.parameterActualArrayDate[$('.monthSlider').slider("getValue")-1];
							window.location.hash = "#view=" + $scope.parameterView + "#month=" + $scope.parameterMonth + "#year=" + $scope.parameterYear + "#target=" + $scope.parameterTopic;
						} else {
							$scope.parameterDay = $scope.parameterActualArrayDate[$('.monthSlider').slider("getValue")-1];
							window.location.hash = "#view=" + $scope.parameterView + "#day=" + $scope.parameterDay + "#month=" + $scope.parameterMonth + "#year=" + $scope.parameterYear + "#target=" + $scope.parameterTopic;
						};

						$scope.$applyAsync();

						d3.select("#temporal-slider-svg")
							.select(".x.axis")
							.selectAll("text")
							.each(
								function(d,i){
									if(i == $('.monthSlider').slider("getValue")-1)
										d3.select(this).style("fill","white");
									else
										d3.select(this).style("fill","gray");
								}
							);
					});

					$(".glyphicon-camera").on("click", function(){
						//var index = $("#myCarousel .carousel-indicators .active").data('slide-to')+1;
						//var svgIndex = "svg-container-" + index;
						if($("#myCarousel").find(".item.active").attr('id') === "svg-container-2"){
							saveSvgAsPng(document.getElementById("svg2"), "italy-" + $scope.parameterDay + "/" + $scope.parameterMonth + "/" + $scope.parameterYear + ".png");
						} else if($("#myCarousel").find(".item.active").attr('id') === "svg-container-4"){
							saveSvgAsPng(document.getElementById("svg-word"), "italy-" + $scope.parameterDay + "/" + $scope.parameterMonth + "/" + $scope.parameterYear + ".png");
						}

					});

					$("#explore-image").on("click", function(){
						if($scope.parameterFrequency != 2){
							if ($scope.parameterFrequency == 0){
								$("#span-month-container").show();
								$scope.parameterFrequency += 1;
							} else if ($scope.parameterFrequency == 1) {
								$("#span-day-container").show();
								$scope.parameterFrequency += 1;
							}
							$scope.$apply();
							$('.monthSlider').slider("setValue", 1, false, false);
						}
					});

					$(".glyphicon-zoom-out").on("click", function(){
						if($scope.parameterFrequency != 0){
							if ($scope.parameterFrequency == 1){
								$("#span-month-container").hide();
								$scope.parameterFrequency -= 1;
							} else if ($scope.parameterFrequency == 2) {
								$("#span-day-container").hide();
								//$scope.parameterMonth = 1;
								$scope.parameterFrequency -= 1;
							}
							$scope.$apply();
							$('.monthSlider').slider("setValue", 1, false, false);
						}
					});

					var x, y, valueline, area, valueline2, area2, xAxis;

					$http({
						method: "GET",
						//url: "http://94.177.167.89:3000/restAPI/timeFrequency?attribute=hs",
						url: "https://api.controlodio.it:4000/restAPI/timeFrequency?attribute=hs",
						params: params
					})
					.then(function (data, status, headers, config) {
						
						if (data['status'] == 200) {

							var data = data['data'].data;
			
							if(date_identifier == "day")
								$scope.parameterDay = d3.min(data, function(d) { return d[date_identifier]; });
							else if(date_identifier == "month")
								$scope.parameterMonth = d3.min(data, function(d) { return d[date_identifier]; });
							else 
								$scope.parameterYear = d3.min(data, function(d) { return d[date_identifier]; });

							$('.monthSlider').data('slider').options.max = data.length;

							var height = $(".slider-horizontal").height() * 2.5;
							var width_slider = parseInt($( ".slider-horizontal" ).width());

							var g = d3.select("#temporal-slider-svg")
										.append("g");

							x = d3.scalePoint().range([0, width_slider]);
							y = d3.scaleLinear().range([height, 7]);

							x.domain(data.map(function(d) { return d[date_identifier]; }));
							y.domain([0, d3.max(data, function(d) { return d.count; })]);

							var xAxis = d3.axisBottom(x).ticks(data.length);

							valueline = d3.line()
								.x(function(d) { return x(d[date_identifier]); })
								.y(function(d) { return y(d.count); })
								.curve(d3.curveCatmullRom);

							area = d3.area()
								.x(function(d) { return x(d[date_identifier]); })
								.y0(height)
								.y1(function(d) { return y(d.count); })
								.curve(d3.curveCatmullRom);

							valueline2 = d3.line()
								.x(function(d) { return x(d[date_identifier]); })
								.y(function(d) { return y(d.yes); })
								.curve(d3.curveCatmullRom);

							area2 = d3.area()
								.x(function(d) { return x(d[date_identifier]); })
								.y0(height)
								.y1(function(d) { return y(d.yes); })
								.curve(d3.curveCatmullRom);

							d3.select("#temporal-slider-svg").selectAll(".linesLine_chart")
								.data(data)
								.enter().append("line")
								.attr("x1",function(d) { return x(d[date_identifier]); })
								.attr("x2",function(d) { return x(d[date_identifier]); })
								.attr("y2", height)
								.attr("y1",function(d) {
									var top = d.count;
									return y(top);
								})
								.style("stroke-width","1px")
								.style("stroke","black")
								.style("opacity","0.32")
								.attr("class","linesLine_chart");

							d3.select("#temporal-slider-svg").append("path")
								.data([data])
								.attr("class", "line1")
								.attr("d", valueline);

							d3.select("#temporal-slider-svg").append("path")
								.data([data])
								.attr("class", "area1")
								.attr("d", area);

							d3.select("#temporal-slider-svg").append("path")
								.data([data])
								.attr("class", "line2")
								.attr("d", valueline2);

							d3.select("#temporal-slider-svg").append("path")
								.data([data])
								.attr("class", "area2")
								.attr("d", area2);

							g.append("g")
								.attr("class", "x axis")
								.attr("transform", "translate(0," + height + ")")
								.call(xAxis);

							d3.select("#temporal-slider-svg")
								.select(".x.axis")
								.selectAll("text")
								.each(
									function(d,i){
										if(i == 0) d3.select(this).style("text-anchor", "start");
										else if(i == data.length - 1) d3.select(this).style("text-anchor", "end");
										else d3.select(this).style("text-anchor", "middle");
									}
								);

						} else {
							//d3.select(element).attr("fill", "grey");
						}
						return 1;
					}, function myError(response) {
						//d3.select(element).attr("fill", "grey");
						return 0;
					});
					return {
						getX : function() {
							return x;
						},
						getY : function() {
							return y;
						},
						getXAxis : function() {
							return xAxis;
						},
						getValueLine: function() {
							return valueline;
						}
					}					
				}();

				$scope.$watch('' + '[parameterTopic]', function($newVal, $oldVal, $scope) {

					factoryGetPercentageLine.getPercentage(
						line_chart,
						$scope.parameterFrequency,
						$scope.parameterYear,
						$scope.parameterMonth,
						$scope.parameterDay,
						$scope.parameterTopic,
						$scope.parameterMonthsName,
						$scope.parameterActualArrayDate,
						$scope.parameterAdmindivlevel,
						$scope.parameterMobile
					)
					.then(function(response){

						d3.select("#temporal-slider-svg")
								.select(".x.axis")
								.selectAll("text")
								.each(
									function(d,i){
										if(i == $('.monthSlider').slider("getValue")-1)
											d3.select(this).style("fill","white");
										else
											d3.select(this).style("fill","gray");
									}
								);
					});
				}, true);

				$scope.$watch('' + '[parameterFrequency]', function($newVal, $oldVal, $scope) {

					if($scope.parameterFrequency == 0) {$(".glyphicon-zoom-out").hide(); $("#explore-image").show().css("left","0%");}
					else if($scope.parameterFrequency == 1) {$(".glyphicon-zoom-out").show().css("left","25%"); $("#explore-image").show().css("left","-25%");}
					else if($scope.parameterFrequency == 2) {$(".glyphicon-zoom-out").show().css("left","0%"); $("#explore-image").hide();}

					factoryGetPercentageLine.getPercentage(
						line_chart,
						$scope.parameterFrequency,
						$scope.parameterYear,
						$scope.parameterMonth,
						$scope.parameterDay,
						$scope.parameterTopic,
						$scope.parameterMonthsName,
						$scope.parameterActualArrayDate,
						$scope.parameterAdmindivlevel,
						$scope.parameterMobile
					)
					.then(function(response){

						$scope.parameterActualArrayDate = [];
						if ($scope.parameterFrequency == 0) {
							response.forEach(function(d){
								$scope.parameterActualArrayDate.push(d['year']);
							});
						} else if ($scope.parameterFrequency == 1) {
							response.forEach(function(d){
								$scope.parameterActualArrayDate.push(d['month']);
							});
						} else {
							response.forEach(function(d){
								$scope.parameterActualArrayDate.push(d['day']);
							});
						}

						if ($scope.parameterFrequency == 2){
							var url = document.location.toString();
							if(url.match(/#day=(\w+)/) && url.match(/#user=(\w+)/)) {
								var input_day = url.match(/#day=(\w+)/)[1];
								$('.monthSlider').slider("setValue", input_day, true, true);
								$scope.parameterDay = input_day;
							} else{
								$scope.parameterDay = d3.min(response, function(d) { return d["day"]; });
							}
							window.location.hash = "#view=" + $scope.parameterView + "#day=" + $scope.parameterDay + "#month=" + $scope.parameterMonth + "#year=" + $scope.parameterYear + "#target=" + $scope.parameterTopic;
						}
						else if ($scope.parameterFrequency == 1){
							$scope.parameterMonth = d3.min(response, function(d) { return d["month"]; });
							window.location.hash = "#view=" + $scope.parameterView + "#month=" + $scope.parameterMonth + "#year=" + $scope.parameterYear + "#target=" + $scope.parameterTopic;
						}
						else{
							$scope.parameterYear = d3.min(response, function(d) { return d["year"]; });
							window.location.hash = "#view=" + $scope.parameterView + "#year=" + $scope.parameterYear + "#target=" + $scope.parameterTopic;
						}

						d3.select("#temporal-slider-svg")
							.select(".x.axis")
							.selectAll("text")
							.each(
								function(d,i){
									if(i == $('.monthSlider').slider("getValue")-1)
										d3.select(this).style("fill","white");
									else
										d3.select(this).style("fill","gray");
								}
							); 					
					});
				}, true);

				//CHECK IF IS MOBILE !!!
				$(document).ready(function() {

					$('#myCarousel').bind('slid.bs.carousel', function (e) {

						if($("#myCarousel").find(".item.active").attr('id') === "svg-container-2"){
							for(var i = 0; i < $(".grid-item").length; i++) {
								var $item = $(".grid-item")[i];
								$('.grid-container').masonry('remove', $item);
							}
						}

						//Cambia URL ogni volta che si cambia il carosello
						var item = $("#myCarousel").find('.item.active').data('name');
						$scope.parameterView = item;
						$scope.$apply();

						var url = document.location.toString();
						url = url.split('#value').map(el => el.split('#')).reduce((acc, curr) => acc.concat(curr));
						url.shift();
						url[0] = "view=" + item;
						url = url.join();
						url = url.replace(/,/g, "#");
						if (item) window.location.hash = url;

						call_get_percentage();
					});

					manage_url_carousel();

					$("#logo-contro-odio-img").click(function(){
						window.location.replace("http://controlodio.it");
					});

					$('#province_icon').click(function(){
						$scope.parameterAdmindivlevel = 2;
						d3.selectAll(".logo-img").style("opacity", 0.55);
						d3.select(this).style("opacity", 1);
						$scope.$apply();
						call_get_percentage();
					});

					$('#region_icon').click(function(){
						$scope.parameterAdmindivlevel = 1;
						d3.selectAll(".logo-img").style("opacity", 0.55);
						d3.select(this).style("opacity", 1);
						$scope.$apply();
						call_get_percentage();
					});

					$('#nation_icon').click(function(){
						$scope.parameterAdmindivlevel = 0;
						d3.selectAll(".logo-img").style("opacity", 0.55);
						d3.select(this).style("opacity", 1);
						$scope.$apply();
						call_get_percentage();
					});

					$(".targets").click(function(){
						update_targets($(this).attr("value"));
					});

					$(".glyphicon-link").click(function(){
						var url = document.location.toString();
						url += "#user=true";
						$('#js-copytextarea').html(url);
					})

					var copyTextareaBtn = document.querySelector('#js-textareacopybtn');
					copyTextareaBtn.addEventListener('click', function(event) {
						var copyTextarea = document.querySelector('#js-copytextarea');
						copyTextarea.focus();
						copyTextarea.select();
						try {
							var successful = document.execCommand('copy');
							var msg = successful ? 'successful' : 'unsuccessful';
							console.log('Copying text command was ' + msg);
						} catch (err) {
							console.log('Oops, unable to copy');
						}
					});

					function call_get_percentage() {
						factoryGetPercentageLine.getPercentage(
							line_chart,
							$scope.parameterFrequency,
							$scope.parameterYear,
							$scope.parameterMonth,
							$scope.parameterDay,
							$scope.parameterTopic,
							$scope.parameterMonthsName,
							$scope.parameterActualArrayDate,
							$scope.parameterAdmindivlevel,
							$scope.parameterMobile
						)
						.then(function(response){

							d3.select("#temporal-slider-svg")
									.select(".x.axis")
									.selectAll("text")
									.each(
										function(d,i){
											if(i == $('.monthSlider').slider("getValue") - 1)
												d3.select(this).style("fill","white");
											else
												d3.select(this).style("fill","gray");
										}
									);
						});
					}
				});
			}
		};
	}]);