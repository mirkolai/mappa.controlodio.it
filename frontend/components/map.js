angular.module("mapdiv", [])
	.factory('d3', function(){
		return d3;
	})
	.factory('topojson', function(){
		return topojson;
	})
	.factory('factoryGetPercentageMap', ['$http', function ($http) {
		return {
			getPercentage: function (
				parameter_frequency,
				parameter_admindivlevel,
				parameter_year,
				parameter_month,
				parameter_day,
				parameter_topic,
				parameter_map_type,
				params,
				scale,
				path,
				projection,
				nodes,
				simulateToDorling) {

					//var params2 = jQuery.extend({}, params);
					params['administrative_division'] = parameter_admindivlevel;

					$http({
						method: "GET",
						//url: "http://94.177.167.89:3000/restAPI/levelOfAttribute?",
						url: "https://api.controlodio.it:4000/restAPI/levelOfAttribute?",
						params: params
					})
					.then(function (data, status, headers, config) {

						if (data['data'].status == 200) {
							if(data['data'].data.length != null) {
								var data = data['data'];
								var percentFormat = d3.format(".0%");
								var totalFormat = d3.format(",");

								var tot_yes = 0;
								var tot_count = 0;

								data.data.forEach(function(el){
									if(el['administrative_division_' + parameter_admindivlevel] != ""){
										tot_yes += el['yes'];
										tot_count += el['count'];
									}
								});

								if(tot_count == 0){
									$("#info-italy-hs").html(percentFormat(0));
									$("#info-italy-total").html(totalFormat(0));
								} else {
									var value = tot_yes / tot_count;
									$("#info-italy-hs").html(percentFormat(value));
									$("#info-italy-total").html(totalFormat(tot_count));
								}

								if(nodes != null){
									nodes.forEach(
										function(node){
											var data_element = data.data.filter( function(data_filter){ return node.properties['COD_'+parameter_admindivlevel] == data_filter['administrative_division_' + parameter_admindivlevel]; } );
											if(data_element.length != 0) node.count = data_element[0]['count'];
											else node.count = 0;
										}
									);
								}

								d3.selectAll(".city").each(
									function(d){
										var element = d3.select(this);
										var data_element = data.data.filter( function(data_filter){ return element.attr("code") == data_filter['administrative_division_' + parameter_admindivlevel]; } );

										if(data_element.length == 0) {
											data_element = [];
											data_element.push({count: 0, no: 0, yes: 0, administrative_division_1: element.attr("code")});
										}

										if(data_element[0]['count'] == 0){
											element.attr("HS", 0);
											element.attr("count", 0);
											element.transition().duration(750).style("fill", "gray");
											if(d.selected == true){
												$("#info-province-hs").html(percentFormat(d3.select(this).attr("HS")));
												$("#info-province-total").html(totalFormat(d3.select(this).attr("count")));	
											}
										} else {
											var value = data_element[0]['yes'] / data_element[0]['count'];
											element.attr("HS", value);
											element.attr("count", data_element[0]['count']);
											element.transition().duration(750).style("fill", scale(value));
											if(d.selected == true){
												$("#info-province-hs").html(percentFormat(value));
												$("#info-province-total").html(totalFormat(data_element[0]['count']));	
											}
										}


									}
								);

								if (parameter_map_type ==  "dorling"){

									function calc_params_min_max(){
										var params = {};
										if (parameter_topic != undefined) params['topic'] = parameter_topic;

										if(parameter_admindivlevel == 1) params['is_administrative_division_1'] = "true";
										else if (parameter_admindivlevel ==2) params['is_administrative_division_2'] = "true";
										else params['is_administrative_division_0'] = "true";

										if (parameter_frequency != undefined) {
											if(parameter_frequency == 0){
												var prev_year = parameter_year - 1;
												params['startdate'] = "31/12/" + prev_year;
												params['pastdays'] = 365;
												params['frequency'] = "annually";
											}
											else if(parameter_frequency == 1) {
												var lastday = function(y, m){
													return  new Date(y, m, 0).getDate();
												}
												var prev_month = ((parameter_month == 1) ? 12 : (parameter_month - 1));
												params['startdate'] = lastday(parameter_year, prev_month) + "/" + prev_month + "/" + parameter_year;
												params['pastdays'] = 90;
												params['frequency'] = "monthly";
											}
											else {
												params['startdate'] = parameter_day + "/" + parameter_month + "/" + parameter_year;
												params['pastdays'] = 30;
												params['frequency'] = "daily";
											}
										};
										return params;
									}

									var params_min_max = calc_params_min_max();

									$http({
										method: "GET",
										//url: "http://94.177.167.89:3000/restAPI/minmax?attribute=hs",
										url: "https://api.controlodio.it:4000/restAPI/minmax?attribute=hs",
										params: params_min_max
									})
									.then(function (response_min_max, status, headers, config) {
										if (response_min_max['status'] == 200) {
											var data_min_max = response_min_max['data'].data;

											data_min_max = data_min_max[0];

											var max = data_min_max["max_tweet"];
											var min = data_min_max["min_tweet"];

											var ray_dorling = 40;
											if(parameter_frequency == 2) ray_dorling = 100;

											var scaleR = d3.scaleLinear()
												.domain([min, max])
												.range([0.1, ray_dorling]);

											var admindivision = d3.selectAll(".city");

											simulateToDorling(nodes, admindivision, scaleR, true);
										}
										return 1;
									});

								}
							}


						} else {
							d3.select(".city").transition().duration(750).attr("fill", "grey");
						}
						return 1;
					}, function myError(response) {
						d3.select(element).attr("fill", "grey");
						return 0;
					});
			}
		}
	}])
	.directive('mapdiv', ["d3","topojson","factoryGetPercentageMap", "$http", function(d3, topojson, factoryGetPercentageMap, $http) {
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
				parameterAdmindivlevel: '=',
				parameterActualArrayDate:'@',
				parameterSlider:'@',
				parameterMapType:'@',
				parameterMobile:'@'
			},
			transclude: true,
			link: function ($scope, $element, $attrs) {

				$(document).ready(function() {
					$('input[type=radio][name=legend]', '#legend_form').change(
						function(){
							console.log("Changing Legend!");
							check_legend();
						}
					);
				});

				var width = $("#svg-container-2").width(),
					height = $("#svg-container-2").height();

				d3.select("#svg2")
					.attr("viewBox",
							function(){
								return "0 0 " + width + " " + height;
							}
						)
					.attr("preserveAspectRatio", "xMinYMin meet");

				var scale = (width + (width * 1.5));
				if (scale < 1000) scale = 1500;
				else if (scale < 1500) scale = 2000;
				else if (scale < 2000) scale = 2500;

				if($scope.parameterMobile && navigator.userAgent.match(/iPad/i)) scale = 3000;


				var projection = d3.geoAlbers()
					.center([0, 41])
					.rotate([347, 0])
					.parallels([35, 45])
					.scale(scale)
					.translate([width / 2, height / 1.8]);

				var path = d3.geoPath()
					.projection(projection);

				d3.select("#svg2")
					.append("g")
					.attr("class","map_province");

				d3.select("#svg2")
					.call(
						d3.zoom()
							.scaleExtent([1, 7])
							.translateExtent([[(width/8.5), -100], [width - (width/8.5), height]])
							//.extent([[0, 0], [width/2, height/2]])
							.on("zoom", zoomed)
					);

				d3.select(window).on('resize', resize);

				function resize() {
					var width = $("#svg-container-2").width(),
					height = $("#svg-container-2").height();

					d3.select("#svg2")
						.call(
							d3.zoom()
								.scaleExtent([1, 7])
								.translateExtent([[(width/8.5), -100],[width - (width/8.5),height]])
								//.extent([[0, 0], [width/2, height/2]])
								.on("zoom", zoomed)
						);

				}

				d3.json("data/json/europe3.topojson", function (error, json) {

					d3.select(".map_province")
						.selectAll(".euro")
						.data(topojson.feature(json, json.objects.europe3).features)
						.enter()
						.append("path")
						.attr("class", "euro")
						.attr("d", path);

				});	

				(function create_legend (){

					var scale = d3.scaleLinear()
						.domain([0, 0.5, 1])
						.range(["#fff5f0", "#fb6a4a","#67000d"]);

					// append a defs (for definition) element to your SVG
					var svgLegend = d3.select('#svg2').append('g').attr("id","legend-g")
						.attr("width",150);

					var defs = svgLegend.append('defs');

					// append a linearGradient element to the defs and give it a unique id
					var linearGradient = defs.append('linearGradient')
						.attr('id', 'linear-gradient');

					// horizontal gradient
					linearGradient
						.attr("x1", "0%")
						.attr("y1", "0%")
						.attr("x2", "100%")
						.attr("y2", "0%");

					// append multiple color stops by using D3's data/enter step
					linearGradient.selectAll("stop")
						.data([
							{offset: "0%", color: "#fff5f0"},
							{offset: "50%", color: "#fb6a4a"},
							{offset: "100%", color: "#67000d"}
						])
						.enter().append("stop")
						.attr("class", function(d,i){return "stop-" + i;})
						.attr("offset", function(d) { 
							return d.offset; 
						})
						.attr("stop-color", function(d) { 
							return d.color; 
						});

					// draw the rectangle and fill with gradient
					svgLegend.append("rect")
						.attr("x", 10)
						.attr("y", 50)
						.attr("rx", 4)
						.attr("ry", 4)
						.attr("width", 130)
						.attr("height", 15)
						.style("fill", "url(#linear-gradient)");

					//create tick marks
					var xLeg = d3.scaleLinear()
						.domain([0, 1])
						.range([10, 140]);

					var axisLeg = d3.axisBottom(xLeg)
						.tickValues(scale.domain())

					svgLegend
						.attr("class", "axis")
						.attr("id", "axis-legend")
						.append("g")
						.attr("transform", "translate(0, 60)")
						.call(axisLeg);					
				})();
				(function date_container(){
					d3.select("#svg2")
						.append("g")
						.attr("id", "g-date-text")
							.append("text")
								.attr("id", "date-text")
								.style("fill", "#cecece")
								.style("font-family", "Consolas, courier")
								.style("font-size", "2.8em")
								.attr("x", 5)
								.attr("y", 35)
								.text($scope.parameterDay + "/" + $scope.parameterMonth + "/" + $scope.parameterYear);
				})();

				function zoomed(){
					var t = d3.event.transform;
					d3.select(".map_province")
						.attr("transform", t)
						.style("stroke-width", 1 / t.k + "px");
				}

				function clear_map_info() {
					d3.selectAll(".map_province").selectAll(".city").style("stroke","white").style("stroke-width","0.5px")
						.each(function(d){d.selected = false});

					$('#flag-img').attr("src", "http://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Flag_of_Italy.svg/320px-Flag_of_Italy.svg.png");
					$('#flag-img').attr("onclick", "window.open('http://it.wikipedia.org/wiki/Italia', '_blank')");

					$("#info-province-name").html("");
					//$("#info-province-population").html("");

					$("#info-province-target").html("");
					$("#info-province-total").html("");
					$("#info-province-hs").html("");

					$("#info-click-adv").show();
					$("#info-map-items-div").hide();

				}

				function update_map_info() {

					d3.selectAll(".map_province").selectAll(".city")
						.each(function(d){
							if(d.selected){
								var percentFormat = d3.format(".0%");
								var totalFormat = d3.format(",");

								$("#info-province-hs").html(percentFormat(d3.select(this).attr("HS")));
								$("#info-province-total").html(totalFormat(d3.select(this).attr("count")));								
							}
						});
				}

				function click_on_path(d){
					if($scope.parameterAdmindivlevel != 0){
						if(d.selected){
							d3.selectAll(".map_province").selectAll(".city").style("stroke","white").style("stroke-width","0.5px");
							d.selected = false;
							clear_map_info();
						} else {
							this.parentNode.appendChild(this);
							d.selected = true;
							d3.selectAll(".map_province").selectAll(".city").style("stroke","white").style("stroke-width","0.5px");
							d3.select(this).style("stroke","steelblue").style("stroke-width","1px");

							$("#info-click-adv").hide();
							$("#info-map-items-div").show();

							var name = (($scope.parameterAdmindivlevel == 2) ? "Provincia" : "Regione");
							if(d.properties[name] == "-") name = "Città Metropolitana";

							var url_stemma = "http://"+d.properties["url_stemma"];
							$('#flag-img').attr("src", url_stemma);

							var url_wiki = "http://"+d.properties["url"];
							$('#flag-img').attr("onclick", "window.open('"+url_wiki+"', '_blank')");

							$("#info-province-name-label").html(name+": ");
							$("#info-province-name").html(d.properties[name]);
							//$("#info-province-population").html(d.properties.popolazione);
							
							var percentFormat = d3.format(".0%");
							var totalFormat = d3.format(",");

							$("#info-province-hs").html(percentFormat(d3.select(this).attr("HS")));
							$("#info-province-total").html(totalFormat(d3.select(this).attr("count")));
						}					
					}
				}

				function calc_params(){
					var params = {};
					if ($scope.parameterTopic != undefined) params['topic'] = $scope.parameterTopic;

					if ($scope.parameterFrequency != undefined) {
						if($scope.parameterFrequency == 0){
							params['year'] = $scope.parameterYear;
						}
						else if($scope.parameterFrequency == 1) {
							params['month'] = $scope.parameterMonth;
							params['year'] = $scope.parameterYear;
						}
						else {
							params['day'] = $scope.parameterDay;
							params['month'] = $scope.parameterMonth;
							params['year'] = $scope.parameterYear;
						}
					};
					return params;
				}

				function calc_params_avg_median(){
					var params = {};
					if ($scope.parameterTopic != undefined) params['topic'] = $scope.parameterTopic;

					if($scope.parameterAdmindivlevel == 1) params['is_administrative_division_1'] = "true";
					else if ($scope.parameterAdmindivlevel ==2) params['is_administrative_division_2'] = "true";
					else params['is_administrative_division_0'] = "true";

					if ($scope.parameterFrequency != undefined) {
						if($scope.parameterFrequency == 0){
							var prev_year = $scope.parameterYear - 1;
							params['startdate'] = "31/12/" + prev_year;
							params['pastdays'] = 365;
						}
						else if($scope.parameterFrequency == 1) {
							var lastday = function(y, m){
								return  new Date(y, m, 0).getDate();
							}
							var prev_month = (($scope.parameterMonth == 1) ? 12 : ($scope.parameterMonth - 1));
							params['startdate'] = lastday($scope.parameterYear, prev_month) + "/" + prev_month + "/" + $scope.parameterYear;
							params['pastdays'] = 90;
						}
						else {
							params['startdate'] = $scope.parameterDay + "/" + $scope.parameterMonth + "/" + $scope.parameterYear;
							params['pastdays'] = 30;
						}
					};
					return params;
				}

				function update_map(scale) {
					params = calc_params();

					factoryGetPercentageMap.getPercentage(
						$scope.parameterFrequency,
						$scope.parameterAdmindivlevel,
						$scope.parameterYear,
						$scope.parameterMonth,
						$scope.parameterDay,
						$scope.parameterTopic,
						$scope.parameterMapType,
						params,
						scale,
						path,
						projection,
						$scope.nodes,
						simulateToDorling
					);
				}

				function load_avg_median_legend(api_name, api_selector,callback) {

					var params =  calc_params_avg_median();

					$http({
						method: "GET",
						url: "https://api.controlodio.it:4000/restAPI/" + api_name + "?attribute=hs",
						params: params
					})
					.then(function (data, status, headers, config) {

						if (data['status'] == 200) {
							var data = data['data'].data;
							data = data[0];

							var scale = d3.scaleLinear()
								.domain([0, data[api_selector], 1])
								.range(["#fff5f0", "#fb6a4a","#67000d"]);

							console.log("data.avg_fraq: " + data[api_selector]);

							d3.select("#linear-gradient").select(".stop-1")
								.transition()
								.duration(750)
								.attr("offset", data[api_selector]);

							callback(scale);
						}

						return 1;
					}, function myError(response) {
						return 0;
					});
				}

				function load_standard_legend(callback) {

					var scale = d3.scaleLinear()
						.domain([0, 0.5, 1])
						.range(["#fff5f0", "#fb6a4a","#67000d"]);

					d3.select("#linear-gradient").select(".stop-1")
						.transition()
						.duration(750)
						.attr("offset", 0.5);

					callback(scale);
				}

				function check_legend() {
					if($('input[name=legend]:checked', '#legend_form').val() === "AVG"){
						load_avg_median_legend("avg", "avg_fraq",update_map);
					} else if($('input[name=legend]:checked', '#legend_form').val() === "Median"){
						load_avg_median_legend("median", "avg(median_frac)",update_map);
					} else {
						load_standard_legend(update_map);
					}
				}

				function load_dorling(scale) {

					var params = calc_params();
					params['administrative_division'] = $scope.parameterAdmindivlevel
					$http({
						method: "GET",
						//url: "http://94.177.167.89:3000/restAPI/levelOfAttribute?",
						url: "https://api.controlodio.it:4000/restAPI/levelOfAttribute?",
						params: params
					})
					.then(function (data, status, headers, config) {

						if (data['data'].status == 200) {
							if(data['data'].data.length != null) {
								var data = data['data'];
								var percentFormat = d3.format(".0%");
								var totalFormat = d3.format(",.2r");

								var tot_yes = 0;
								var tot_count = 0;

								data.data.forEach(function(el){
									if(el['administrative_division_' + $scope.parameterAdmindivlevel] != ""){
										tot_yes += el['yes'];
										tot_count += el['count'];
									}
								});

								if(tot_count == 0){
									$("#info-italy-hs").html(percentFormat(0));
									$("#info-italy-total").html(totalFormat(0));
								} else {
									var value = tot_yes / tot_count;
									$("#info-italy-hs").html(percentFormat(value));
									$("#info-italy-total").html(totalFormat(tot_count));
								}

								if(scale !== undefined){
									d3.selectAll(".city").each(
										function(d){
											var element = d3.select(this);
											var data_element = data.data.filter( function(data_filter){ return element.attr("code") == data_filter['administrative_division_' + $scope.parameterAdmindivlevel]; } );

											if(data_element.length == 0) {
												data_element = [];
												data_element.push({count: 0, no: 0, yes: 0, administrative_division_1: element.attr("code")});
											}

											if(data_element[0]['count'] == 0){
												element.attr("HS", 0);
												element.attr("count", 0);
												element.transition().duration(750).attr("fill", "gray");
												if(d.selected == true){
													$("#info-province-hs").html(percentFormat(d3.select(this).attr("HS")));
													$("#info-province-total").html(totalFormat(d3.select(this).attr("count")));	
												}
											} else {
												var value = data_element[0]['yes'] / data_element[0]['count'];
												element.attr("HS", value);
												element.attr("count", data_element[0]['count']);
												element.transition().duration(750).attr("fill", scale(value));
												if(d.selected == true){
													$("#info-province-hs").html(percentFormat(value));
													$("#info-province-total").html(totalFormat(data_element[0]['count']));	
												}
											}
										}
									);
								}

								function calc_params_min_max(){
									var params = {};
									if ($scope.parameterTopic != undefined) params['topic'] = $scope.parameterTopic;

									if($scope.parameterAdmindivlevel == 1) params['is_administrative_division_1'] = "true";
									else if ($scope.parameterAdmindivlevel ==2) params['is_administrative_division_2'] = "true";
									else params['is_administrative_division_0'] = "true";

									if ($scope.parameterFrequency != undefined) {
										if($scope.parameterFrequency == 0){
											var prev_year = $scope.parameterYear - 1;
											params['startdate'] = "31/12/" + prev_year;
											params['pastdays'] = 365;
											params['frequency'] = "annually";
										}
										else if($scope.parameterFrequency == 1) {
											var lastday = function(y, m){
												return  new Date(y, m, 0).getDate();
											}
											var prev_month = (($scope.parameterMonth == 1) ? 12 : ($scope.parameterMonth - 1));
											params['startdate'] = lastday($scope.parameterYear, prev_month) + "/" + prev_month + "/" + $scope.parameterYear;
											params['pastdays'] = 90;
											params['frequency'] = "monthly";
										}
										else {
											params['startdate'] = $scope.parameterDay + "/" + $scope.parameterMonth + "/" + $scope.parameterYear;
											params['pastdays'] = 30;
											params['frequency'] = "daily";
										}
									};
									return params;
								}

								var params_min_max = calc_params_min_max();

								$scope.nodes.forEach(
									function(node){
										var data_element = data.data.filter( function(data_filter){ return node.properties['COD_'+$scope.parameterAdmindivlevel] == data_filter['administrative_division_' + $scope.parameterAdmindivlevel]; } );
										if(data_element.length != 0) node.count = data_element[0]['count'];
										else node.count = 0;
									}
								);

								$http({
									method: "GET",
									//url: "http://94.177.167.89:3000/restAPI/minmax?attribute=hs",
									url: "https://api.controlodio.it:4000/restAPI/minmax?attribute=hs",
									params: params_min_max
								})
								.then(function (response_min_max, status, headers, config) {
									if (response_min_max['status'] == 200) {
										var data_min_max = response_min_max['data'].data;

										data_min_max = data_min_max[0];

										var max = data_min_max["max_tweet"];
										var min = data_min_max["min_tweet"];

										var ray_dorling = 40;
										if($scope.parameterFrequency == 2) ray_dorling = 100;

										var scaleR = d3.scaleLinear()
											.domain([min, max])
											.range([0.1, ray_dorling]);

										var admindivision = d3.selectAll(".city");

										if($scope.parameterMapType == "dorling"){
											simulateToDorling($scope.nodes, admindivision, scaleR);
										} else {
											simulateToMap($scope.nodes, admindivision, scaleR);
										}
									}
									return 1;
								});
							}
						}
					});
				}



				// DORLING FUNCTIONS

				var simulateToMap = function (nodes, cities, scaleR) {

					nodes.forEach(function(node) {
						node.x = node.x0;
						node.y = node.y0;
					});

					var links = d3.merge($scope.neighbors.map(function(neighborSet, i) {
						return neighborSet.filter(j => nodes[j]).map(function(j) {
							return {source: i, target: j, distance: nodes[i].r + nodes[j].r + 3};
						});
					}));

					var simulation = d3.forceSimulation(nodes)
						.force("cx", d3.forceX().x(d => width / 2).strength(0.02))
						.force("cy", d3.forceY().y(d => height / 2).strength(0.02))
						.force("link", d3.forceLink(links).distance(d => d.distance))
						.force("x", d3.forceX().x(d => d.x).strength(0.1))
						.force("y", d3.forceY().y(d => d.y).strength(0.1))
						.force("collide", d3.forceCollide().strength(0.8).radius(d => d.r + 3))
						.stop();

					while (simulation.alpha() > 0.1) {
						simulation.tick();
					}

					nodes.forEach(function(node){
						var circle = pseudocircle(node),
						closestPoints = node.rings.slice(1).map(function(ring){
							var i = d3.scan(circle.map(point => distance(point, ring.centroid)));
							return ring.map(() => circle[i]);
						}),
						interpolator = d3.interpolateArray(node.rings, [circle, ...closestPoints]);

						node.interpolator = function(t){
							var str = pathString(interpolator(t));
							// Prevent some fill-rule flickering for MultiPolygons
							if (t > 0.99) {
								return str.split("Z")[0] + "Z";
							}
								return str;
						};
					});

					cities
						.sort((a, b) => b.r - a.r)
						.transition()
						.duration(1500)
						.attrTween("d", node => t => node.interpolator(1 - t));

				}

				var simulateToDorling = function (nodes, cities, scaleR, update) {

					nodes.forEach(function(node) {
						node.x = node.x0;
						node.y = node.y0;
						node.r = scaleR(node.count);
					});

					var links = d3.merge($scope.neighbors.map(function(neighborSet, i) {
						return neighborSet.filter(j => nodes[j]).map(function(j) {
							return {source: i, target: j, distance: nodes[i].r + nodes[j].r + 3};
						});
					}));

					var simulation = d3.forceSimulation(nodes)
						.force("cx", d3.forceX().x(d => width / 2).strength(0.02))
						.force("cy", d3.forceY().y(d => height / 2).strength(0.02))
						.force("link", d3.forceLink(links).distance(d => d.distance))
						.force("x", d3.forceX().x(d => d.x).strength(0.1))
						.force("y", d3.forceY().y(d => d.y).strength(0.1))
						.force("collide", d3.forceCollide().strength(0.8).radius(d => d.r + 3))
						.stop();

					while (simulation.alpha() > 0.1) {
						simulation.tick();
					}

					nodes.forEach(function(node){
						var circle = pseudocircle(node),
						closestPoints = node.rings.slice(1).map(function(ring){
						var i = d3.scan(circle.map(point => distance(point, ring.centroid)));
							return ring.map(() => circle[i]);
						}),
						interpolator = d3.interpolateArray(node.rings, [circle, ...closestPoints]);

						node.interpolator = function(t){
							var str = pathString(interpolator(t));
							// Prevent some fill-rule flickering for MultiPolygons
							if (t > 0.99) {
								return str.split("Z")[0] + "Z";
							}
							return str;
						};
					});

					cities
						.sort((a, b) => b.r - a.r)
						.transition()
						.duration(function(){return (update==null) ? 1500 : 0})
						.attrTween("d", node => node.interpolator);
						//.attrTween("d", node => t => node.interpolator(t));

				}

				function pseudocircle(node) {
					return node.rings[0].map(function(point){
						var angle = node.startingAngle - 2 * Math.PI * (point.along / node.perimeter);
						return [
							Math.cos(angle) * node.r + node.x,
							Math.sin(angle) * node.r + node.y
						];
					});
				}

				function cleanUpGeometry(node) {
					node.rings = (node.geometry.type === "Polygon" ? [node.geometry.coordinates] : node.geometry.coordinates);

					node.rings = node.rings.map(function(polygon){
						polygon[0].area = d3.polygonArea(polygon[0]);
						polygon[0].centroid = d3.polygonCentroid(polygon[0]);
						return polygon[0];
					});

					node.rings.sort((a, b) => b.area - a.area);

					node.perimeter = d3.polygonLength(node.rings[0]);

					// Optional step, but makes for more circular circles
					bisect(node.rings[0], node.perimeter / 72);

					node.rings[0].reduce(function(prev, point){
						point.along = prev ? prev.along + distance(point, prev) : 0;
						node.perimeter = point.along;
						return point;
					}, null);

					node.startingAngle = Math.atan2(node.rings[0][0][1] - node.y0, node.rings[0][0][0] - node.x0);

				}

				function bisect(ring, maxSegmentLength) {
					for (var i = 0; i < ring.length; i++) {
						var a = ring[i], b = i === ring.length - 1 ? ring[0] : ring[i + 1];

						while (distance(a, b) > maxSegmentLength) {
							b = midpoint(a, b);
							ring.splice(i + 1, 0, b);
						}
					}
				}

				function distance(a, b) {
					return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
				}

				function midpoint(a, b) {
					return [a[0] + (b[0] - a[0]) * 0.5, a[1] + (b[1] - a[1]) * 0.5];
				}

				function pathString(d) {
					return (d.rings || d).map(ring => "M" + ring.join("L") + "Z").join(" ");
				}




				$scope.$watch('' + '[parameterDay, parameterMonth, parameterYear, parameterActualArrayDate]', function($newVal, $oldVal, $scope) {
					d3.select("#g-date-text")
						.select("#date-text")
						.text(
							function(){
								if($scope.parameterFrequency == 0){
									return $scope.parameterYear;
								} else if ($scope.parameterFrequency == 1) {
									return $scope.parameterMonth + "/" + $scope.parameterYear;
								} else {
									return $scope.parameterDay + "/" + $scope.parameterMonth + "/" + $scope.parameterYear;
								}
							});
				}, true);
 
 				$scope.$watch('' + '[parameterYear,' + 'parameterMonth,' + 'parameterDay,' + 'parameterTopic, parameterActualArrayDate]', function($newVal, $oldVal, $scope) {
					update_map_info();
					check_legend();
				}, true);

				$scope.$watch('' + 'parameterAdmindivlevel', function($newVal, $oldVal, $scope) {

					clear_map_info();

					d3.json("data/json/admindiv" + $scope.parameterAdmindivlevel + "lite.topojson", function (error, json) {

						$scope.neighbors = topojson.neighbors(json.objects["admindiv"+$scope.parameterAdmindivlevel+"lite"].geometries);
						$scope.nodes = topojson.feature(json, json.objects["admindiv"+$scope.parameterAdmindivlevel+"lite"]).features;

						var projectPoints = function(d){
												if (!isNaN(d[0]) && !isNaN(d[1]) ){
													var x = d[0]
													var y = d[1]
													d[0] = projection([x, y])[0]
													d[1] = projection([x, y])[1]
												}
												else{
													d.forEach(function(d1){
													 return projectPoints(d1)
													});
												}
											}

						$scope.nodes.forEach(function(node, i) {

							//console.log(node)
							node['geometry']['coordinates'].forEach(
								function(sides){
									projectPoints(sides);
								}
							);
							var centroid = d3.geoPath().centroid(node);
							node.x0 = centroid[0];
							node.y0 = centroid[1];

							cleanUpGeometry(node);
						});


						d3.select(".map_province")
							.selectAll(".city")
							.remove();

						var params = calc_params();

						if($('input[name=legend]:checked', '#legend_form').val() === "AVG"){
							load_avg_median_legend("avg", "avg_fraq",load_new_map);
						} else if($('input[name=legend]:checked', '#legend_form').val() === "Median"){
							load_avg_median_legend("median", "avg(median_frac)",load_new_map);
						} else {
							var scale = d3.scaleLinear()
								.domain([0, 0.5, 1])
								.range(["#fff5f0", "#fb6a4a","#67000d"]);
							load_new_map(scale);
						}

						function load_new_map(scale) {
							d3.select(".map_province")
								.selectAll(".city")
								.data($scope.nodes)
								.enter()
								.append("path")
								.attr("class", "city")
								.attr("code", function (d) {
									d.selected = false;
									if($scope.parameterAdmindivlevel != 0)
										return d.properties['COD_'+$scope.parameterAdmindivlevel];
									else
										return "IT";
								})
								.attr("d", pathString)
								.on("click", click_on_path)
								.each(function(d,i){
									var code = d.properties['COD_'+$scope.parameterAdmindivlevel]
								});
								if ($scope.parameterMapType ==  "dorling") {
									load_dorling(scale);
								} else{
									factoryGetPercentageMap.getPercentage(
										$scope.parameterFrequency,
										$scope.parameterAdmindivlevel,
										$scope.parameterYear,
										$scope.parameterMonth,
										$scope.parameterDay,
										$scope.parameterTopic,
										$scope.parameterMapType,
										params,
										scale,
										path,
										projection,
										$scope.nodes,
										simulateToDorling
									);
								}
						}
					});

				}, true);
				
				$scope.$watch('' + 'parameterMapType', function($newVal, $oldVal, $scope) {
					if ($oldVal == $newVal) return;
					load_dorling();
				}, true);
			}
		}
	}]);