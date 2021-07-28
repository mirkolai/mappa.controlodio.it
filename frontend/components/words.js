angular.module("wordsdiv", [])
	.factory('d3', function(){
		return d3;
	})
	.factory('factoryGetWords', ['$http', function ($http) {
		return {
			getWords: function (
				parameter_frequency,
				parameter_year,
				parameter_month,
				parameter_day,
				parameter_topic,
				params,
				myWordCloud) {
					
					$http({
						method: "GET",
						//url: "http://94.177.167.89:3000/restAPI/tokenfrequency?type=word&attribute=hs&limit=25",
						url: "https://api.controlodio.it:4000/restAPI/tokenfrequency?type=word&attribute=hs&limit=25",
						params: params
					})
					.then(function (data, status, headers) {

						var data = data['data'].data;

						console.log("HI")

						if(data.length > 0) {
							var array_to_viz = [];

							var max = d3.max(data, function(d){return d.count});
							var min = d3.min(data, function(d){return d.count});

							var max_hs = d3.max(data, function(d){return d.count_hs_yes / d.count});
							var min_hs = d3.min(data, function(d){return d.count_hs_yes / d.count});

							var fill_words = d3.scaleLinear()
								.domain([min_hs, max_hs])
								.range(["#fefefe", "#be1425"]);

							var scale_word_size = d3.scaleLinear().domain([min,max]).range([10,60]);

							data.forEach(function(d, i){
								array_to_viz.push({count_hs_yes: d.count_hs_yes, count: d.count, text: d.token, size: scale_word_size(d.count), color: fill_words(d.count_hs_yes / d.count)})
							});

							showNewWords(myWordCloud, 0);
							showNewWords(myWordCloud, 0);

							$(".glyphicon-refresh").on("click", function(){
								showNewWords(myWordCloud, 0);
							});
						}

						function showNewWords(vis, i) {
							i = i || 0;
							vis.update(array_to_viz);
						}

						return 1;
					}, function myError(error) {
						console.log("Error")
						return 0;
					});
			},
			getBarChart: function (
				parameter_frequency,
				parameter_year,
				parameter_month,
				parameter_day,
				parameter_topic,
				params,
				width,
				height,
				margin,
				x,
				y,
				y2) {
					$("#svg-word").hide();
					$("#bar_chart_options").hide();
					$("#svg-container-4").append('<div class="loader" id="bar_chart_loader" style="top:25%; position:absolute"></div>')
						
					$http({
						method: "GET",
						//url: "http://94.177.167.89:3000/restAPI/tokenfrequency?type=word&attribute=hs&limit=25",
						url: "https://api.controlodio.it:4000/restAPI/tokenfrequency?type=word&attribute=hs&limit=25",
						params: params
					})
					.then(function (data, status, headers) {

						var data = data['data'].data;

						$("#bar_chart_loader").remove();

						if(data.length > 0) {
							$("#svg-word").show();
							$("#bar_chart_options").show();
							$("#bar_chart_loader").remove();

							var max_count =  d3.max(data, function(d) { return d.count; });
							var max_hate = d3.max(data, function(d) { return d.count_hs_yes/d.count; });
							var min_hate = d3.min(data, function(d) { return d.count_hs_yes/d.count; });

							x.domain(data.map(function(d) { return d.token; }));
							y.domain([0, max_count]);
							y2.domain([0, max_hate]);

							var scale_hate = d3.scaleLinear()
								.domain([0, max_hate])
								.range(["#fff5f0", "#67000d"]);
							var scale_count = d3.scaleLinear()
								.domain([0, max_hate])
								.range(["#fff5f0", "#67000d"]);

							d3.select(".axis--y")
								.transition().duration(1000)
								.call(d3.axisLeft(y).ticks(10));

							d3.select(".axis--y2")
								.transition().duration(1000)
								.call(d3.axisRight(y2).ticks(10, "%"));

							d3.selectAll(".bar")
								.data(data)
								.attr("id", function(d) {
									var name_selector = replaceAll(d.token, "#", "hash_");
									name_selector = replaceAll(name_selector, "@", "");
									return "bar_" + name_selector})
								.transition().duration(1000)
								.attr("x", function(d) { return x(d.token); })
								.attr("y", function(d) { return y(d.count); })
								.attr("width", x.bandwidth()/2)
								.attr("height", function(d) { return height - y(d.count); });

							d3.selectAll(".bar-hate")
								.data(data)
								.transition().duration(1000)
								.attr("x", function(d) { return x(d.token)+x.bandwidth()/2; })
								.attr("y", function(d) { return y2(d.count_hs_yes/d.count); })
								.attr("width", x.bandwidth()/2)
								.style("fill", function(d){ return scale_hate(d.count_hs_yes/d.count)})
								.attr("height", function(d) { return (height - y2(d.count_hs_yes/d.count)) > 0 ? (height - y2(d.count_hs_yes/d.count)) : 0 });

							d3.select("#g_bar_chart").select(".axis--x")
								.transition().duration(1000)
								// .attr("transform", "translate(0," + height + ")")
								.call(d3.axisBottom(x))
								.selectAll("text")
									.style("text-anchor", "end")
									.attr("dx", "-.8em")
									.attr("dy", "-0.25em")
									.attr("transform", "rotate(-90)");

							d3.selectAll(".axis--x text").on("click", function(d){
								d3.select(this)
									.each(function(d){

										d3.selectAll(".axis--x text")
											.style("fill", "#cecece");
										d3.select(this)
											.style("fill", "#c60000");

										var name_selector = replaceAll(d3.select(this).text(), "#", "hash_");
										name_selector = replaceAll(name_selector, "@", "");

										var data = d3.select("#bar_" + name_selector).data();


										$("#info-word-click-adv").hide();
										$("#info-word-items-div").show();
										$("#info-word-text").html(d3.select(this).text());
										$("#info-word-text-2").html(d3.select(this).text());
										$("#info-word-count").html(data[0].count);

										var hs = ((data[0].count_hs_yes / data[0].count) * 100).toFixed(2);

										$("#info-word-HS").html(hs + '%');

									});
							});

							function replaceAll(str, find, replace) {
								return str.replace(new RegExp(find, 'g'), replace);
							}
						}

						return 1;
					}, function myError(error) {
						console.log("Error")
						return 0;
					});
			},
			loadCo_words: function (
				parameter_frequency,
				parameter_year,
				parameter_month,
				parameter_day,
				parameter_topic,
				params,
				word_selected) {

					console.log(params);
					console.log(word_selected)
					
					$http({
						method: "GET",
						//url: 'http://94.177.167.89:3000/restAPI/tokencorrelation?token='+word_selected+'&limit=10',
						url: 'https://api.controlodio.it:4000/restAPI/tokencorrelation?token='+word_selected+'&limit=10',
						
						params: params
					})
					.then(function (data, status, headers) {

						var data = data['data'].data;
						$("#modal-content-co-words").show();
						$("#loader_co_words").hide();

						if(data.length > 0) {

							var nodes = [];
							data.forEach(function(d, i){
								nodes.push({"id": d.token_2+"_"+i, "value": d.count, "hs": d.count_hs_yes});
							});
							nodes.push({"id": data[0].token_1, "value": 0 });

							links = [];
							for(var i = 0; i < data.length; i++) {
								links.push({"source": data[0].token_1, "target": data[i].token_2+"_"+i})
							}

							var max = d3.max(data, function(d){return d.count});
							var min = d3.min(data, function(d){return d.count});

							var radiusScale = d3.scaleLinear()
								.domain([min, max])
								.range([20, 50]);

							var fontScale = d3.scaleLinear()
								.domain([min, max])
								.range([20, 50]);

							var graph = {nodes, links};

							load_force_cooccurrences(graph, radiusScale, fontScale);
						} else {
							var width = $('#svg-co-word').width()/2;
							var height = $('#svg-co-word').height()/2;
							d3.select('#svg-co-word')
								.append("text")
									.text("NO DATA")
									.style("position","absolute")
									.style("top","50%")
									.style("left","50%")
									.attr("transform","translate("+(width-50)+","+height+")")
									.style("fill", "white")
									.style("font-size", 30 + "px")

						}

						function load_force_cooccurrences(graph, radiusScale, fontScale) {
							const svg = d3.select('#svg-co-word'),
								width = parseInt(d3.select('#svg-co-word').style("width")),
								height = parseInt(d3.select('#svg-co-word').style("height"));

							svg.selectAll("*").remove();

							const simulation = d3.forceSimulation()
								.nodes(graph.nodes)
								.force('link',
									d3.forceLink()
										.id(d => d.id)
										.distance(function (d) {
											return 75;
										})
								)
								.force("collide", d3.forceCollide(90).iterations(16))
								//.force("collide",d3.forceCollide( function(d){return d.r + 8 }).iterations(16) )
								.force('charge', d3.forceManyBody())//.distanceMin(800).distanceMax(1000))
								.force('center', d3.forceCenter(width/2, height/2))
								.on('tick', ticked);

							simulation
								.force('link')
								.links(graph.links);

							let link = svg.selectAll('.link')
								.data(graph.links)
								.enter().append('path')
									.attr('class', 'link')
									.style("fill", "transparent")
									.style("opacity", "0.5");

							let node = svg.selectAll('.node')
								.data(graph.nodes)
									.enter().append('g')
									.attr('class', 'node')
									.call(d3.drag()
									.on("start", dragstarted)
									.on("drag", dragged)
									.on("end", dragended));

							node.append('circle')
								.attr('r', function(d){return (d.value != 0) ? radiusScale(d.value) : 70})
								.attr("fill", "#161616")
								// .attr("fill", function(d){return (d.value != 0) ? "none" : "white"})
								.style("stroke", function(d){return (d.value != 0) ? "#c1c1c1" : "#c1c1c1"})
								.on('mouseover.fade', fade(0.4))
								.on('mouseout.fade', fade(1))
								.on('dblclick',releasenode);

							// var lables = node.append("text")
							// 	.text(function(d) {
							// 		return d.id;
							// 	})
							// 	.style("font-size", function(d){return (d.value != 0) ? (fontScale(d.value) + "px") : (40 + "px")})
							// 	.attr('x', function(d){return -(this.getComputedTextLength()/2)})
							// 	.attr('y', 0);

							var pieArc = d3.arc().cornerRadius(11);
							pieArc.startAngle(0).endAngle(1.5 * Math.PI);

							var textArc = d3.arc().cornerRadius(11);
							textArc.startAngle(0).endAngle(2 * Math.PI);

							var pathPie = node
											.append("path")
												.attr("fill","red")
												.attr("id", function(d, i){ return "arcPie_" + i})
												.attr("d", function(d, i){
													if(d.value != 0){
														var temp = radiusScale(d.value);
														pieArc.innerRadius(temp)(d, i);
														var end = (d.hs/d.value) * 2 * Math.PI;
														pieArc.endAngle(end);
														temp += 10;
														return pieArc.outerRadius(temp)(d, i);
													} else {
														return null;
													}
												})
												.each(function(d){
													this._current = d;
												});

							var pathText = node
											.append("path")
												.attr("fill","transparent")
												.attr("class", "arcText")
												.attr("id", function(d, i){ return "arcText_" + i})
												.attr("d", function(d, i){
													if(d.value != 0){
														var temp = radiusScale(d.value);
														textArc.innerRadius(temp)(d, i);
														temp += 10;
														return textArc.outerRadius(temp)(d, i);
													} else {
														// var temp = 38;
														// textArc.innerRadius(temp)(d, i);
														// temp += 10;
														// var start = d.id;
														// start = start.getComputedTextLength()/2;
														// textArc.startAngle(start);
														// return textArc.outerRadius(temp)(d, i);
													}

													var temp = (d.value != 0) ? radiusScale(d.value) : 38;
													textArc.innerRadius(temp)(d, i);
													temp += 10;
													return textArc.outerRadius(temp)(d, i);
												})
												.each(function(d){
													this._current = d;
												});

							var pathTextNode = node
												.append("text")
												.attr("class", "text_node")
												.style("font-size", "15px")
												.attr("dy", -5)
												.attr("dx", 5)
												.append("textPath")
												.attr("xlink:href", function(d, i){return "#arcText_" + i})
												.attr("startOffset", 5)
												.attr("dy", 10)
												.style("fill", "white")
												.text(
													function(d, i){
														var word = d.id;
														word = word.slice(0, word.length - 2);
														return word;
													}
												);

							var length = graph.nodes.length - 1;
							d3.select("#arcText_"+length).remove();
							d3.select("#arcText_"+length).remove();

							d3.selectAll(".node")
								.each(function(d){
									if(d.value == 0){
										d3.select(this)
											.append("text")
												.style("fill", "white")
												.text(function(d) {
													return d.id;
												})
												.style("font-size", 30 + "px")
												.attr('x', function(d){return -(this.getComputedTextLength()/2)})
												.attr('y', 2);
									} else {
										d3.select(this)
											.append("text")
												.style("fill", "white")
												.text(function(d) {
													var format = d3.format(".1%");
													// return format(d.hs / d.value);
													return d.value;
												})
												.style("font-size", 15 + "px")
												.attr('x', function(d){return -(this.getComputedTextLength()/2)})
												.attr('y', 2);
									}
								});

							function ticked() {

								// node.attr('transform', d => `translate(${d.x},${d.y})`);
								node.attr('transform', function(d) {
									var radius = +d3.select(this).select("circle").attr("r")+20;
									return "translate("+Math.max(radius, Math.min(width - radius, d.x)) + "," + Math.max(radius, Math.min(height - radius, d.y)) + ")";
								});

								node
									.attr("cx", function(d) { var radius = +d3.select(this).select("circle").attr("r")+20; return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
									.attr("cy", function(d) { var radius = +d3.select(this).select("circle").attr("r")+20; return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
								
								// link
								// 	.attr("x1", function(d) { return d.source.x; })
								// 	.attr("y1", function(d) { return d.source.y; })
								// 	.attr("x2", function(d) { return d.target.x; })
								// 	.attr("y2", function(d) { return d.target.y; });


								link.attr("d", function(d) {
									var dx = (d.target.x - d.source.x),
									dy = (d.target.y - d.source.y),
									dr = Math.sqrt(dx * dx + dy * dy);

									// return "M" + d.source.x + "," + d.source.y + "A" + 0 + "," + 0 + " 0 0,1 " + d.target.x + "," + d.target.y;
									return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
								});

								link.attr("d", function(d) {

									var pl = this.getTotalLength(),
										r = (5) + radiusScale(d.target.value),
										m = this.getPointAtLength(pl - r);

									var dx = m.x - d.source.x,
										dy = m.y - d.source.y,
										dr = Math.sqrt(dx * dx + dy * dy);

									// return "M" + d.source.x + "," + d.source.y + "A" + 0 + "," + 0 + " 0 0,1 " + m.x + "," + m.y;
									return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + m.x + "," + m.y;
								});
							}

							function dragstarted(d) {
								if (!d3.event.active) simulation.alphaTarget(0.3).restart();
								d.fx = d.x;
								d.fy = d.y;
							}

							function dragged(d) {
								d.fx = d3.event.x;
								d.fy = d3.event.y;
							}

							function dragended(d) {
								if (!d3.event.active) simulation.alphaTarget(0);
								//d.fx = null;
								//d.fy = null;
							}
							function releasenode(d) {
								d.fx = null;
								d.fy = null;
							}

							const linkedByIndex = {};
							graph.links.forEach(d => {
								linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
							});

							function isConnected(a, b) {
								return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
							}

							function fade(opacity) {
								return d => {
									node.style('stroke-opacity', function (o) {
										const thisOpacity = isConnected(d, o) ? 1 : opacity;
										this.setAttribute('fill-opacity', thisOpacity);
										return thisOpacity;
									});
									link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
								};
							}
						}

						return 1;
					}, function myError(error) {
						console.log("Error")
						return 0;
					});
			}
		}
	}])
	.directive('wordsdiv', ["d3", "factoryGetWords", "$http", function(d3, factoryGetWords, $http) {
		return {
			restrict: 'E',
			scope: {
				parameterFrequency:'@',
				parameterYear:'@',
				parameterMonth:'@',
				parameterDay:'@',
				parameterTopic:'@',
				parameterView:'@',
				parameterSlider:'@'
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
						if($scope.parameterFrequency == 0) {
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

				function wordCloud(rot) {

					var fill_words = d3.scaleOrdinal(d3.schemeCategory10);

					var rotation = d3.scalePow().exponent(5).domain([0,1]).range([-60,60]);

					var width = $(window).outerWidth();
					var height = $("#svg-container-4").height();

					//Construct the word cloud's SVG element

					if (/iPhone|Android/i.test(navigator.userAgent)) {
						d3.select("#svg-word")
							.append("g")
							.attr("class", "svg-word-cloud")
							.attr("transform", "translate(" + (width/2) + "," + (height/2) + ") rotate(-90) scale(0.8)");
					} else if(WURFL.form_factor == "Tablet") {
						if(width > 1000) {
							d3.select("#svg-word")
								.append("g")
								.attr("class", "svg-word-cloud")
								.attr("transform", "translate(" + (width/2) + "," + (height/2) + ") rotate(-90) scale(1)");
						} else {
							d3.select("#svg-word")
								.append("g")
								.attr("class", "svg-word-cloud")
								.attr("transform", "translate(" + (width/2) + "," + (height/2) + ") rotate(-90) scale(1)");
						}
					} else {
						d3.select("#svg-word")
							.append("g")
							.attr("class", "svg-word-cloud")
							.attr("transform", "translate(" + (width/3) + "," + (height/2) + ") scale(1)");
					}


					//Draw the word cloud
					function draw(words) {

						var cloud = d3.select("#svg-word").select("g").selectAll("g text")
							.data(words, function(d) { return d.text; });

						//Entering words
						cloud.enter()
							.append("text")
							.style("font-family", "Raleway")
							.style("fill", function(d, i) { return d.color; })
							.attr("text-anchor", "middle")
							//.attr('font-size', 1)
							.text(function(d) { return d.text; });

						//Entering and existing words
						cloud.transition()
							.duration(1300)
							.style("font-size", function(d) { return d.size + "px"; })
							.attr("transform", function(d) {
							return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
							})
							.style("fill-opacity", 1);

						cloud.exit()
							.transition()
							.duration(1300)
							.style('fill-opacity', 0)
							.attr('font-size', 1)
							.remove();
					}

					return {
						update: function(words) {
							var width = $("#svg-container-4").width();
							d3.layout.cloud().size([width*1.5, height/1.5])
								.words(words)
								.padding(5)
								.rotate(function() { if(rot){return rotation(Math.random())} else {return ~~(Math.random() * 2) * 90;} })
								.font("Raleway")
								.fontSize(function(d) { return d.size; })
								.on("end", draw)
								.start();
						}
					}
				}

				var myWordCloud = wordCloud(false);

				function applyOrder(value) {

					function replaceAll(str, find, replace) {
						return str.replace(new RegExp(find, 'g'), replace);
					}

					var tsv = d3.selectAll(".bar").data();

					var max_hate = d3.max(tsv, function(d) { return d.count_hs_yes/d.count; });

					var scale_hate = d3.scaleLinear()
						.domain([0, max_hate])
						.range(["#fff5f0", "#67000d"]);

					tsv.sort(function(a, b) {
						if(value == "hate"){
							return parseFloat(a.count_hs_yes/a.count) - parseFloat(b.count_hs_yes/b.count);
						} else {
							return parseFloat(a[value]) - parseFloat(b[value]);
						}
					});

					x.domain(tsv.map(function(d) { return d.token; }));

					d3.select("#g_bar_chart").select(".axis--x")
						.transition().duration(1000)
						.attr("transform", "translate(0," + height + ")")
						.call(d3.axisBottom(x))
						.selectAll("text")
							.style("text-anchor", "end")
							.attr("dx", "-.8em")
							.attr("dy", "-.25em")
							.attr("transform", "rotate(-90)");

					// update the bars
					d3.selectAll(".bar")
						.data(tsv)
						.transition().duration(1000)
						.attr("x", function(d) { return x(d.token); })
						.attr("y", function(d) { return y(d.count); })
						.attr("height", function(d) { return height - y(d.count); })
						.attr("id", function(d) {
									var name_selector = replaceAll(d.token, "#", "hash_");
									name_selector = replaceAll(name_selector, "@", "");
									return "bar_" + name_selector})

					d3.selectAll(".bar-hate")
						.data(tsv)
						.transition().duration(1000)
						.style("fill", function(d){ return scale_hate(d.count_hs_yes/d.count)})
						.attr("x", function(d) { return x(d.token)+x.bandwidth()/2; })
						.attr("y", function(d) { return y2(d.count_hs_yes/d.count); })
						.attr("height", function(d) { return (height - y2(d.count_hs_yes/d.count)) > 0 ? (height - y2(d.count_hs_yes/d.count)) : 0 });

				}

				var height, width, x, y, y2, margin;

				$(".svg-word-cloud").hide();

				$(document).ready(function(){
					$("#co_words_button").click(function(){
	 					var params = calc_params();
	 					var word_selected = $("#info-word-text").html();

	 					$("#modal_info_co_words").modal("show");
						$("#loader_co_words").show();
						$("#modal-content-co-words").hide();

						word_selected = replaceAll(word_selected, "#", "%23");

						function replaceAll(str, find, replace) {
							return str.replace(new RegExp(find, 'g'), replace);
						}

						factoryGetWords.loadCo_words(
							$scope.parameterFrequency,
							$scope.parameterYear,
							$scope.parameterMonth,
							$scope.parameterDay,
							$scope.parameterTopic,
							params,
							word_selected
						);
					});

					$("#word_cloud_button").click(function(){
						$(".svg-word-cloud").fadeIn( "slow");
						$(".glyphicon-refresh").fadeIn( "slow");
						$(".glyphicon-eye-close").fadeIn( "slow");
						$("#g_bar_chart").fadeOut( "slow");
						$("#word_cloud_button").hide();

						$("#bar_chart_options").hide();

						var params = calc_params();

						factoryGetWords.getWords(
							$scope.parameterFrequency,
							$scope.parameterYear,
							$scope.parameterMonth,
							$scope.parameterDay,
							$scope.parameterTopic,
							params,
							myWordCloud
						);

					});

					$(".glyphicon-eye-close").click(function(){
						$(".svg-word-cloud").fadeOut( "slow");
						$(".glyphicon-refresh").fadeOut( "slow");
						$(".glyphicon-eye-close").fadeOut( "slow");
						$("#g_bar_chart").fadeIn( "slow");
						$("#word_cloud_button").show();
						$("#info-word-items-div").hide();

						$("#bar_chart_options").show();
					
					});

					d3.select("#show_only_count").on("click", function() {
						d3.selectAll(".bar")
							.transition().duration(1000)
							.attr("width", x.bandwidth());
						d3.selectAll(".bar-hate")
							.transition().duration(1000)
							.attr("width", 0);
						d3.select(".axis--y2")
							.transition().duration(1000)
							.style("opacity", 0);
						d3.select(".axis--y")
							.transition().duration(1000)
							.style("opacity", 1);
					});
					d3.select("#show_only_hate").on("click", function() {
						d3.selectAll(".bar-hate")
							.transition().duration(1000)
							.attr("transform", "translate( " + (-x.bandwidth()/2) + ", 0 )")
							.attr("width", x.bandwidth());

						d3.selectAll(".bar")
							.transition().duration(1000)
							.attr("width", 0);

						d3.select(".axis--y")
							.transition().duration(1000)
							.style("opacity", 0);

						d3.select(".axis--y2")
							.transition().duration(1000)
							.attr("transform", "translate( 0, 0 )")
							.call(d3.axisLeft(y2).ticks(10, "%"))
							.style("opacity", 1);
						d3.select(".axis--y2")
							.selectAll("text:not(#axis--y2_legend)")
							.transition().duration(1000)
							.attr("dx", "-4em");
						d3.select("#axis--y2_legend")
							.transition().duration(1000)
							.attr("dy", "0em");
					});
					d3.select("#show_only_both").on("click", function() {
						d3.selectAll(".bar")
							.transition().duration(1000)
							.attr("width", x.bandwidth()/2);
						d3.selectAll(".bar-hate")
							.transition().duration(1000)
							.attr("transform", "translate( " + 0 + ", 0 )")
							.attr("width", x.bandwidth()/2);
						d3.select(".axis--y2")
							.transition().duration(1000)
							.attr("transform", "translate( " + width + ", 0 )")
							.call(d3.axisRight(y2).ticks(10, "%"))
							.style("opacity", 1);
						d3.select(".axis--y2")
							.selectAll("text:not(#axis--y2_legend)")
							.transition().duration(1000)
							.attr("transform", "translate( 0, 0 )")
							.attr("dx", "0em");
						d3.select("#axis--y2_legend")
							.transition().duration(1000)
							.attr("dy", "1.5em")
							.attr("dx", "-1.5em");
						d3.select(".axis--y")
							.transition().duration(1000)
							.style("opacity", 1);
							
					});
					d3.select("#order_count").on("click", function() {
						$(this).hide();
						$("#order_hate").show();
						applyOrder("count");
					});
					d3.select("#order_hate").on("click", function() {
						$(this).hide();
						$("#order_count").show();
						applyOrder("hate");
					});

					margin = {top: 5, right: 40, bottom: 150, left: 40};

					var container_selector;
					switch($scope.parameterView){
						case "map": container_selector = "#svg-container-2"; break;
						case "liquid": container_selector = "#svg-container-1"; break;
						case "virality": container_selector = "#svg-container-3"; break;
						case "words": container_selector = "#svg-container-4"; break;
					}

					height = $(container_selector).height() - margin.top - margin.bottom;
					width = $(container_selector).width() - margin.left - margin.right;

					d3.select("#svg-word").append("g")
						.attr("id", "g_bar_chart")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

					x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
					y = d3.scaleLinear().rangeRound([height, 0]),
					y2 = d3.scaleLinear().rangeRound([height, 0]);

					d3.select("#g_bar_chart").append("g")
						.attr("class", "bar-axis axis--x")
						.attr("transform", "translate(0," + height + ")")
						.call(d3.axisBottom(x))
						.selectAll("text")
							.style("text-anchor", "end")
							.attr("dx", "-.8em")
							.attr("dy", ".15em")
							.attr("transform", "rotate(-90)");

					d3.select("#g_bar_chart").append("g")
						.attr("class", "bar-axis axis--y")
						.call(d3.axisLeft(y).ticks(10))
						.append("text")
							// .attr("transform", "rotate(-90)")
							.attr("transform", "translate(0," + height + ") rotate(-90)")
							.style("text-anchor", "end")
							.attr("dx", "-1.5em")
							.attr("dy", "-0.15em")
							.attr("id", "axis--y_legend")
							.text("Occorrenze");

					d3.select("#g_bar_chart").append("g")
						.attr("class", "bar-axis axis--y2")
						.attr("transform", "translate( " + width + ", 0 )")
						.call(d3.axisRight(y2).ticks(10, "%"))
						.append("text")
							// .attr("transform", "rotate(90)")
							.attr("id", "axis--y2_legend")
							.attr("transform", "translate(0," + height + ") rotate(-90)")
							.style("text-anchor", "end")
							.attr("dx", "-1.5em")
							.attr("dy", "1.5em")
							.text("Hate Speech");

					var ciao = [];
					for (var i = 0; i < 25; i++) {
						ciao.push(i);
					}

					d3.select("#g_bar_chart").selectAll(".bar")
						.data(ciao)
						.enter().append("rect")
							.attr("class", "bar")
							.attr("width", 10)
							.attr("height",height)
							.attr("x", 0)
							.attr("y", 0);

					d3.select("#g_bar_chart").selectAll(".bar-hate")
						.data(ciao)
						.enter().append("rect")
							.attr("class", "bar-hate")
							.attr("width", 10)
							.attr("height",height)
							.attr("x", 0)
							.attr("y", 0);

					var params = calc_params();
					factoryGetWords.getBarChart(
	 						$scope.parameterFrequency,
							$scope.parameterYear,
							$scope.parameterMonth,
							$scope.parameterDay,
							$scope.parameterTopic,
							params,
							width,
							height,
							margin,
							x,
							y,
							y2);
				
				});

				var initial = true;

				$scope.$watch('' + '[parameterYear,' + 'parameterVirality,' + 'parameterMonth,' + 'parameterDay,' + 'parameterTopic,' + 'parameterFrequency,' + 'parameterTopic]', function($newVal, $oldVal, $scope) {

					if(!initial){
						$("#info-word-click-adv").show();
						$("#info-word-items-div").hide();

	 					var params = calc_params();

	 					factoryGetWords.getBarChart(
	 						$scope.parameterFrequency,
							$scope.parameterYear,
							$scope.parameterMonth,
							$scope.parameterDay,
							$scope.parameterTopic,
							params,
							width,
							height,
							margin,
							x,
							y,
							y2);
	 					
	 					$(".svg-word-cloud").hide();
						$(".glyphicon-refresh").hide();
						$(".glyphicon-eye-close").hide();
						$("#g_bar_chart").show();
						$("#word_cloud_button").show();
						$("#info-word-items-div").hide();

						$("#bar_chart_options").show();

	 					if($("#word_cloud_button").css("display") == "none") {
							factoryGetWords.getWords(
								$scope.parameterFrequency,
								$scope.parameterYear,
								$scope.parameterMonth,
								$scope.parameterDay,
								$scope.parameterTopic,
								params,
								myWordCloud
							);
						} else {
							$(".svg-word-cloud").fadeOut( "slow");
							$(".glyphicon-refresh").fadeOut( "slow");
							$(".glyphicon-eye-close").fadeOut( "slow");
							$("#g_bar_chart").fadeIn( "slow");
							$("#word_cloud_button").show();
							$("#info-word-items-div").hide();

							$("#bar_chart_options").show();
						}
					} else {
						initial = false;
					}
	
				}, true);
			}
		}
	}]);