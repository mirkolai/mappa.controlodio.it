(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g=(g.d3||(g.d3 = {}));g=(g.layout||(g.layout = {}));g.cloud = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Word cloud layout by Jason Davies, https://www.jasondavies.com/wordcloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf

	var dispatch = require("d3-dispatch").dispatch;

	var cloudRadians = Math.PI / 180,
		cw = 1 << 11 >> 5,
		ch = 1 << 11;

	module.exports = function() {
		var size = [256, 256],
			text = cloudText,
			font = cloudFont,
			fontSize = cloudFontSize,
			fontStyle = cloudFontNormal,
			fontWeight = cloudFontNormal,
			rotate = cloudRotate,
			padding = cloudPadding,
			spiral = archimedeanSpiral,
			words = [],
			timeInterval = Infinity,
			event = dispatch("word", "end"),
			timer = null,
			random = Math.random,
			cloud = {},
			canvas = cloudCanvas;

		cloud.canvas = function(_) {
			return arguments.length ? (canvas = functor(_), cloud) : canvas;
		};

		cloud.start = function() {
			var contextAndRatio = getContext(canvas()),
				board = zeroArray((size[0] >> 5) * size[1]),
				bounds = null,
				n = words.length,
				i = -1,
				tags = [],
				data = words.map(function(d, i) {
					d.text = text.call(this, d, i);
					d.font = font.call(this, d, i);
					d.style = fontStyle.call(this, d, i);
					d.weight = fontWeight.call(this, d, i);
					d.rotate = rotate.call(this, d, i);
					d.size = ~~fontSize.call(this, d, i);
					d.padding = padding.call(this, d, i);
					d.count = d.count;
					d.count_hs_yes =d.count_hs_yes;
					d.showNewWords = d.showNewWords;
					return d;
				}).sort(function(a, b) { return b.size - a.size; });

			if (timer) clearInterval(timer);
			timer = setInterval(step, 0);
			step();

			return cloud;

			function step() {
				var start = Date.now();
				while (Date.now() - start < timeInterval && ++i < n && timer) {
					var d = data[i];
					d.x = (size[0] * (random() + .5)) >> 1;
					d.y = (size[1] * (random() + .5)) >> 1;
					cloudSprite(contextAndRatio, d, data, i);
					if (d.hasText && place(board, d, bounds)) {
						tags.push(d);
						event.call("word", cloud, d);
						if (bounds) cloudBounds(bounds, d);
						else bounds = [{x: d.x + d.x0, y: d.y + d.y0}, {x: d.x + d.x1, y: d.y + d.y1}];
						// Temporary hack
						d.x -= size[0] >> 1;
						d.y -= size[1] >> 1;
					}
				}
				if (i >= n) {
					cloud.stop();
					event.call("end", cloud, tags, bounds);
				}
			}
		}

		cloud.stop = function() {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
			d3.select("#svg-word-cloud").selectAll("text").on("click", function(d){
				d3.select(this)
					.each(function(d){
						$("#info-word-click-adv").hide();
						$("#info-word-items-div").show();
						$("#info-word-text").html(d.text);
						$("#info-word-text-2").html(d.text);
						$("#info-word-count").html(d.count);

						var hs = ((d.count_hs_yes / d.count) * 100).toFixed(2);

						$("#info-word-HS").html(hs + '%');

						// load_cooccurrences(d);
					});
			});
			return cloud;
		};

		function load_cooccurrences(selected_word) {

			$("#modal_info_co_words").modal("show");
			$("#loader_co_words").show();
			$("#modal-content-co-words").hide();

			$.ajax({
				url: 'http://94.177.167.89:3000/restAPI/tokencorrelation?token='+selected_word.text+'&startdate=01/01/2019&enddate=30/01/2019&topic=all&limit=10',
				success: function (data) {

					$("#modal-content-co-words").show();
					$("#loader_co_words").hide();

					var nodes = [];
					data.data.forEach(function(d, i){
						nodes.push({"id": d.token_2, "value": d.count, "hs": d.count_hs_yes});
					});
					nodes.push({"id": data.data[0].token_1, "value": 0 });

					links = [];
					for(var i = 0; i < data.data.length; i++) {
						links.push({"source": data.data[0].token_1, "target": data.data[i].token_2})
					}

					var max = d3.max(data.data, function(d){return d.count});
					var min = d3.min(data.data, function(d){return d.count});

					var radiusScale = d3.scaleLinear()
						.domain([min, max])
						.range([20, 50]);

					var fontScale = d3.scaleLinear()
						.domain([min, max])
						.range([20, 50]);

					var graph = {nodes, links};

					load_force_cooccurrences(graph, radiusScale, fontScale);
				}
			});
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
				.style("stroke", function(d){return (d.value != 0) ? "white" : "#be1425"})
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
								.text(function(d, i){return d.id});

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

		function getContext(canvas) {
			canvas.width = canvas.height = 1;
			var ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
			canvas.width = (cw << 5) / ratio;
			canvas.height = ch / ratio;

			var context = canvas.getContext("2d");
			context.fillStyle = context.strokeStyle = "red";
			context.textAlign = "center";

			return {context: context, ratio: ratio};
		}

		function place(board, tag, bounds) {
			var perimeter = [{x: 0, y: 0}, {x: size[0], y: size[1]}],
				startX = tag.x,
				startY = tag.y,
				maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
				s = spiral(size),
				dt = random() < .5 ? 1 : -1,
				t = -dt,
				dxdy,
				dx,
				dy;

				while (dxdy = s(t += dt)) {
					dx = ~~dxdy[0];
					dy = ~~dxdy[1];

					if (Math.min(Math.abs(dx), Math.abs(dy)) >= maxDelta) break;

					tag.x = startX + dx;
					tag.y = startY + dy;

					if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
					tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
					// TODO only check for collisions within current bounds.
					if (!bounds || !cloudCollide(tag, board, size[0])) {
						if (!bounds || collideRects(tag, bounds)) {
							var sprite = tag.sprite,
								w = tag.width >> 5,
								sw = size[0] >> 5,
								lx = tag.x - (w << 4),
								sx = lx & 0x7f,
								msx = 32 - sx,
								h = tag.y1 - tag.y0,
								x = (tag.y + tag.y0) * sw + (lx >> 5),
								last;
							for (var j = 0; j < h; j++) {
								last = 0;
								for (var i = 0; i <= w; i++) {
									board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
								}
								x += sw;
							}
							delete tag.sprite;
							return true;
						}
					}
				}
				return false;
		}

		cloud.timeInterval = function(_) {
			return arguments.length ? (timeInterval = _ == null ? Infinity : _, cloud) : timeInterval;
		};

		cloud.words = function(_) {
			return arguments.length ? (words = _, cloud) : words;
		};

		cloud.size = function(_) {
			return arguments.length ? (size = [+_[0], +_[1]], cloud) : size;
		};

		cloud.font = function(_) {
			return arguments.length ? (font = functor(_), cloud) : font;
		};

		cloud.fontStyle = function(_) {
			return arguments.length ? (fontStyle = functor(_), cloud) : fontStyle;
		};

		cloud.fontWeight = function(_) {
			return arguments.length ? (fontWeight = functor(_), cloud) : fontWeight;
		};

		cloud.rotate = function(_) {
			return arguments.length ? (rotate = functor(_), cloud) : rotate;
		};

		cloud.text = function(_) {
			return arguments.length ? (text = functor(_), cloud) : text;
		};

		cloud.spiral = function(_) {
			return arguments.length ? (spiral = spirals[_] || _, cloud) : spiral;
		};

		cloud.fontSize = function(_) {
			return arguments.length ? (fontSize = functor(_), cloud) : fontSize;
		};

		cloud.padding = function(_) {
			return arguments.length ? (padding = functor(_), cloud) : padding;
		};

		cloud.random = function(_) {
			return arguments.length ? (random = _, cloud) : random;
		};

		cloud.on = function() {
			var value = event.on.apply(event, arguments);
			return value === event ? cloud : value;
		};

		return cloud;
	};

	function cloudText(d) {
		return d.text;
	}

	function cloudFont() {
		return "serif";
	}

	function cloudFontNormal() {
		return "normal";
	}

	function cloudFontSize(d) {
		return Math.sqrt(d.value);
	}

	function cloudRotate() {
		return (~~(Math.random() * 6) - 3) * 30;
	}

	function cloudPadding() {
		return 1;
	}

// Fetches a monochrome sprite bitmap for the specified text.
// Load in batches for speed.
function cloudSprite(contextAndRatio, d, data, di) {
  if (d.sprite) return;
  var c = contextAndRatio.context,
      ratio = contextAndRatio.ratio;

  c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
  var x = 0,
      y = 0,
      maxh = 0,
      n = data.length;
  --di;
  while (++di < n) {
    d = data[di];
    c.save();
    c.font = d.style + " " + d.weight + " " + ~~((d.size + 1) / ratio) + "px " + d.font;
    var w = c.measureText(d.text + "m").width * ratio,
        h = d.size << 1;
    if (d.rotate) {
      var sr = Math.sin(d.rotate * cloudRadians),
          cr = Math.cos(d.rotate * cloudRadians),
          wcr = w * cr,
          wsr = w * sr,
          hcr = h * cr,
          hsr = h * sr;
      w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5;
      h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
    } else {
      w = (w + 0x1f) >> 5 << 5;
    }
    if (h > maxh) maxh = h;
    if (x + w >= (cw << 5)) {
      x = 0;
      y += maxh;
      maxh = 0;
    }
    if (y + h >= ch) break;
    c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio);
    if (d.rotate) c.rotate(d.rotate * cloudRadians);
    c.fillText(d.text, 0, 0);
    if (d.padding) c.lineWidth = 2 * d.padding, c.strokeText(d.text, 0, 0);
    c.restore();
    d.width = w;
    d.height = h;
    d.xoff = x;
    d.yoff = y;
    d.x1 = w >> 1;
    d.y1 = h >> 1;
    d.x0 = -d.x1;
    d.y0 = -d.y1;
    d.hasText = true;
    x += w;
  }
  var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data,
      sprite = [];
  while (--di >= 0) {
    d = data[di];
    if (!d.hasText) continue;
    var w = d.width,
        w32 = w >> 5,
        h = d.y1 - d.y0;
    // Zero the buffer
    for (var i = 0; i < h * w32; i++) sprite[i] = 0;
    x = d.xoff;
    if (x == null) return;
    y = d.yoff;
    var seen = 0,
        seenRow = -1;
    for (var j = 0; j < h; j++) {
      for (var i = 0; i < w; i++) {
        var k = w32 * j + (i >> 5),
            m = pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 << (31 - (i % 32)) : 0;
        sprite[k] |= m;
        seen |= m;
      }
      if (seen) seenRow = j;
      else {
        d.y0++;
        h--;
        j--;
        y++;
      }
    }
    d.y1 = d.y0 + seenRow;
    d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
  }
}

// Use mask-based collision detection.
function cloudCollide(tag, board, sw) {
  sw >>= 5;
  var sprite = tag.sprite,
      w = tag.width >> 5,
      lx = tag.x - (w << 4),
      sx = lx & 0x7f,
      msx = 32 - sx,
      h = tag.y1 - tag.y0,
      x = (tag.y + tag.y0) * sw + (lx >> 5),
      last;
  for (var j = 0; j < h; j++) {
    last = 0;
    for (var i = 0; i <= w; i++) {
      if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0))
          & board[x + i]) return true;
    }
    x += sw;
  }
  return false;
}

function cloudBounds(bounds, d) {
  var b0 = bounds[0],
      b1 = bounds[1];
  if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
  if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
  if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
  if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
}

function collideRects(a, b) {
  return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
}

function archimedeanSpiral(size) {
  var e = size[0] / size[1];
  return function(t) {
    return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
  };
}

function rectangularSpiral(size) {
  var dy = 4,
      dx = dy * size[0] / size[1],
      x = 0,
      y = 0;
  return function(t) {
    var sign = t < 0 ? -1 : 1;
    // See triangular numbers: T_n = n * (n + 1) / 2.
    switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
      case 0:  x += dx; break;
      case 1:  y += dy; break;
      case 2:  x -= dx; break;
      default: y -= dy; break;
    }
    return [x, y];
  };
}

// TODO reuse arrays?
function zeroArray(n) {
  var a = [],
      i = -1;
  while (++i < n) a[i] = 0;
  return a;
}

function cloudCanvas() {
  return document.createElement("canvas");
}

function functor(d) {
  return typeof d === "function" ? d : function() { return d; };
}

var spirals = {
  archimedean: archimedeanSpiral,
  rectangular: rectangularSpiral
};

},{"d3-dispatch":2}],2:[function(require,module,exports){
// https://d3js.org/d3-dispatch/ Version 1.0.2. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

var noop = {value: function() {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

exports.dispatch = dispatch;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}]},{},[1])(1)
});