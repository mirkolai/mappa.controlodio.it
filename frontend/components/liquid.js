angular.module("liquiddiv", [])
	.factory('d3', function(){
		return d3;
	})
	.factory('factoryGetPercentageLiquid', ['$http', function ($http) {
		return {
			getPercentage: function (
				parameter_frequency,
				parameter_year,
				parameter_month,
				parameter_day,
				parameter_topic,
				id_svg,
				id_text) {

					var params = {};

					var lastday = function(y, m){
						return  new Date(y, m, 0).getDate();
					}

					params['topic'] = parameter_topic;

					if (parameter_frequency != undefined) {
						if(parameter_frequency == 0){
							params['frequency'] = "annually";
							params['startdate'] = "01/01/" + parameter_year;
							params['enddate'] = "31/12/" + parameter_year;
						}
						else if(parameter_frequency == 1) {
							params['frequency'] = "monthly";
							params['startdate'] = "1/" + parameter_month + "/" + parameter_year;
							params['enddate'] = lastday(parameter_year, parameter_month) + "/" + parameter_month + "/" + parameter_year;
						}
						else {
							params['frequency'] = "daily";
							params['startdate'] = parameter_day + "/" + parameter_month + "/" + parameter_year;
							params['enddate'] = parameter_day + "/" + parameter_month + "/" + parameter_year;
						}
					};

					$http({
						method: "GET",
						//url: "http://94.177.167.89:3000/restAPI/timeFrequency?attribute=hs",
						url: "https://api.controlodio.it:4000/restAPI/timeFrequency?attribute=hs",
						params: params
					})
					.then(function (data, status, headers, config) {

						if (data['data'].status == 200) {
							if(data['data'].data.length != null) {
								var data = data['data'].data;
								data = data[0];

								var percentage = data.yes/data.count;
								percentage *= 100;

								tween_fun(id_text);

								d3.select(id_svg).on("valueChanged")(percentage);

								function tween_fun(id){
									var format = d3.format(",d");
									d3.select(id)
										.transition()
										.duration(750)
										.on("start", function (){
											d3.active(this)
												.tween("text", function() {
													var that = d3.select(this),
													i = d3.interpolateNumber(that.text().replace(/,/g, ""), data.count);
													return function(t) { that.text(format(i(t)));  };
												});
										});
								}
							}
						}

						
					}, function myError(response) {
						//d3.select(element).attr("fill", "grey");
						return 0;
					});
			}
		}
	}])
	.directive('liquiddiv', ["d3","topojson","factoryGetPercentageLiquid", function(d3, topojson, factoryGetPercentageLiquid) {
		return {
			restrict: 'E',
			scope: {
				parameterFrequency:'@',
				parameterYear:'@',
				parameterMonth:'@',
				parameterActualArrayDate:'@',
				parameterDay:'@'
			},
			transclude: true,
			link: function ($scope, $element, $attrs) {

				var width = $("#svg-container-2").width(),
					height = $("#svg-container-2").height();

				d3.select("#liquid-div-container")
					.style("width", (width*0.9)+"px")
					.style("height", (height/2)+"px")
					.style("position", "absolute")
					.style("left", "6%")
					.style("top", (height/3.5)+"px");

				width = $("#liquid-div-container").width(),
				height = $("#liquid-div-container").height();

				d3.select("#svg_liquid_0")
					.attr("width", width/3.1)
					.attr("height", height);

				d3.select("#svg_liquid_1")
					.attr("width", width/3.1)
					.attr("height", height);

				d3.select("#svg_liquid_2")
					.attr("width", width/3.1)
					.attr("height", height);

				width = $("#svg_liquid_0").width(),
				height = $("#svg_liquid_0").height();

				d3.select("#svg-container-1")
					.append("div")
						.attr("class", "liquid_title")
						.style("width", width+"px")
						.style("height", "2em")
						.style("position", "absolute")
						.style("left", "6%")
						.style("top", height/3+"px")
						.style("text-align", "center")
					.append("text")
						.text("Rom");

				d3.select("#svg-container-1")
					.append("div")
						.attr("class", "liquid_title")
						.style("width", width+"px")
						.style("height", "2em")
						.style("position", "absolute")
						.style("left", "6%")
						.style("top", height * 1.7 + "px")
						.style("text-align", "center")
					.append("html")
						.html("<aa id='liquid_tweet_count_0' class = 'liquid_title'>12345</aa> <aa class = 'liquid_subtitle'> tweets</aa>");

				var left = $("#svg-container-2").width()*0.06;

				d3.select("#svg-container-1")
					.append("div")
						.attr("class", "liquid_title")
						.style("width", width+"px")
						.style("height", "2em")
						.style("position", "absolute")
						.style("left", (left + width) + "px")
						.style("top", height/3 + "px")
						.style("text-align", "center")
					.append("text")
						.text("Migranti");

				d3.select("#svg-container-1")
					.append("div")
						.attr("class", "liquid_title")
						.style("width", width+"px")
						.style("height", "2em")
						.style("position", "absolute")
						.style("left", (left + width) + "px")
						.style("top", height * 1.7 + "px")
						.style("text-align", "center")
					.append("html")
						.html("<aa id='liquid_tweet_count_1' class = 'liquid_title'>12345</aa> <aa class = 'liquid_subtitle'> tweets</aa>");

				d3.select("#svg-container-1")
					.append("div")
						.attr("class", "liquid_title")
						.style("width", width+"px")
						.style("height", "2em")
						.style("position", "absolute")
						.style("left", (left + (width*2)) + "px")
						.style("top", height/3 + "px")
						.style("text-align", "center")
					.append("text")
						.html("Minoranze<br>religiose");

				d3.select("#svg-container-1")
					.append("div")
						.attr("class", "liquid_title")
						.style("width", width+"px")
						.style("height", "2em")
						.style("position", "absolute")
						.style("left", (left + (width*2)) + "px")
						.style("top", height*1.7+"px")
						.style("text-align", "center")
					.append("html")
						.html("<aa id='liquid_tweet_count_2' class = 'liquid_title'>12345</aa> <aa class = 'liquid_subtitle'> tweets</aa>");

				var circleColor = "#c60000",
					textColor = "#cecece",
					waveTextColor = "#999999",
					waveColor = "#333";

				d3.select("#svg_liquid_0").call(d3.liquidfillgauge, 28, {
					circleColor: circleColor,
					textColor: textColor,
					waveTextColor: waveTextColor,
					waveColor: waveColor,
					waveAnimateTime: 1000,
					valueCountUpAtStart: false,
					waveRiseAtStart: false
				});


				d3.select("#svg_liquid_1").call(d3.liquidfillgauge, 28, {
					circleColor: circleColor,
					textColor: textColor,
					waveTextColor: waveTextColor,
					waveColor: waveColor,
					waveAnimateTime: 1000,
					valueCountUpAtStart: false,
					waveRiseAtStart: false
				});

				d3.select("#svg_liquid_2").call(d3.liquidfillgauge, 28, {
					circleColor: circleColor,
					textColor: textColor,
					waveTextColor: waveTextColor,
					waveColor: waveColor,
					waveAnimateTime: 1000,
					valueCountUpAtStart: false,
					waveRiseAtStart: false
				});

				$scope.$watch('' + '[parameterYear,' + 'parameterMonth,' + 'parameterDay,' + 'parameterActualArrayDate]', function($newVal, $oldVal, $scope) {
					var targets = ["roma", "etnichs_group", "religion"];
					for (var i = 0; i < 3; i++) {
						var id_text = "#liquid_tweet_count_" + i;
						var id_svg = "#svg_liquid_" + i;
						factoryGetPercentageLiquid.getPercentage(
							$scope.parameterFrequency,
							$scope.parameterYear,
							$scope.parameterMonth,
							$scope.parameterDay,
							targets[i],
							id_svg,
							id_text
						)
					}
				}, true);

			}
		}
	}]);

