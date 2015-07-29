(function(nodetrix) {
	if (!nodetrix.model) nodetrix.model = {};

	// Constructor
	nodetrix.model.Graph = function(id, width, height, config) {
			nodetrix.model.View.call(this, id, width, height);

			// default visual properties
			this.config = {
				nodeSize: config && 'nodesize' in config ? config.nodesize : 10,
				nodeColor: config && 'nodecolor' in config ? config.nodecolor : "#0000FF",
				nodeStroke: config && 'nodestroke' in config ? config.nodestroke : "#0000FF",
				nodeStrokeWidth: config && 'nodestrokewidth' in config ? config.nodestrokewidth : 1,
				linkStroke: config && 'linkstroke' in config ? config.linkstroke : "#0000FF",
				linkStrokeWidth: config && 'linkstrokewidth' in config ? config.linkstrokewidth : 1,

				linkDistance: config && 'linkdistance' in config ? config.linkdistance : 60,

				round: config && 'round' in config ? config.round : 5,
				allowHighlight: config && 'allowhighlight' in config ? config.allowhighlight : true,
				allowLabels: config && 'allowlabels' in config ? config.allowlabels : true
			};

			// data model
			this.graph = { nodes: [], links: [] };
			this.visualgraph = { nodes: [], links: [] }; // it contains the visible parts of the graph
			this.forcegraph = { nodes: [], links: [] }; // it contains the force based parts of the graph

			// force layout
			//this.d3cola = cola.d3adaptor().linkDistance(this.config.linkDistance).size([this.width, this.height]).avoidOverlaps(true).nodes(this.forcegraph.nodes).links(this.forcegraph.links); //.convergenceThreshold(0.1);
			this.d3cola = d3.layout.force().charge(-120).linkDistance(30).size([width, height])
				.nodes(this.forcegraph.nodes).links(this.forcegraph.links);

			this.tick = function() { _this.render(); };

			this.layout = true;
			// TODO: radial layout
			// vax.herokuapp.com  view-source:http://mbostock.github.io/d3/talk/20111116/force-collapsible.html
			// http://bl.ocks.org/mbostock/7607999

			this.nodeHandler = new nodetrix.Handler(this);
	};

	// Inheritance
	for (var proto in nodetrix.model.View.prototype) nodetrix.model.Graph.prototype[proto] = nodetrix.model.View.prototype[proto];

	// Resize
	nodetrix.model.Graph.prototype.resize = function(width, height) {
			nodetrix.model.View.prototype.resize.call(this);

			this.d3cola.size([this.width, this.height]);

			// re-center
			var x = Number.POSITIVE_INFINITY, X = Number.NEGATIVE_INFINITY, y = Number.POSITIVE_INFINITY, Y = Number.NEGATIVE_INFINITY;
			this.node.each(function (v) { x = Math.min(x, v.x - v.width / 2); X = Math.max(X, v.x + v.width / 2); y = Math.min(y, v.y - v.height / 2); Y = Math.max(Y, v.y + v.height / 2); });
			var w = X - x, h = Y - y, cw = this.width, ch = this.height, s = Math.min(cw / w, ch / h), tx = (-x * s + (cw / s - w) * s / 2), ty = (-y * s + (ch / s - h) * s / 2);
			var correction = { translate: [tx, ty], scale: s };

			this.zoom.translate(correction.translate).scale(correction.scale);
	};

	// Update
	nodetrix.model.Graph.prototype.update = function() {
			nodetrix.model.View.prototype.update.call(this);

			var _this = this;
			this.d3cola.on("tick", function() { _this.render(); });
			this.d3cola.start();
	};

	// Render
	nodetrix.model.Graph.prototype.render = function() {
			nodetrix.model.View.prototype.render.call(this);
	};


	// Data binding
	nodetrix.model.Graph.prototype.bind = function(data) {
			this.graph.nodes.splice(0, this.graph.nodes.length);
			this.graph.links.splice(0, this.graph.links.length);

			var _this = this;
			data.nodes.forEach(function(node, i) {
				var visualNode = {
					raw: 'raw' in node ? node.raw : node, // raw node
					id: i, //'id' in node ? node.id : i, // node id
					fixed: 'fixed' in node ? node.fixed : false, // indicates if the node is fixed in the force layout
					x: 'x' in node ? node.x : 0, y: 'y' in node ? node.y : 0, // position in the force layout
					width: 'width' in node ? node.width : _this.config.nodeSize, height: 'height' in node ? node.height : _this.config.nodeSize, // size of the box to avoid overlap in d3cola and visual size
					size: function() { return _this.nodeSize(this); },
					fill: function() { return _this.nodeColor(this); }, // node color
					stroke: function() { return _this.nodeStroke(this); }, // border color
					strokeWidth: function() { return _this.nodeStrokeWidth(this); }, // border thickness
					round: function() { return _this.round(this); },
					clip: function() { return _this.clip(this); },
					highlighted: 'highlighted' in node ? node.highlighted : false,
					sticky: 'fixed' in node ? node.fixed : false,
					labels: 'labels' in node ? node.labels : true,
					images: 'images' in node ? node.images : true,
					links: []
				};
				_this.graph.nodes.push(visualNode);
			});

			data.links.forEach(function(link, i) {
				var source = 'raw' in link ? link.raw.source : link.source;
				var target = 'raw' in link ? link.raw.target : link.target;

				var visualLink = {
					id: 'id' in link ? link.id : i,
					raw: 'raw' in link ? link.raw : link, // raw link
					source: _this.graph.nodes[source], // visual node leaving
					target: _this.graph.nodes[target], // visual node arriving
					stroke: function() { return _this.linkStroke(this); }, // link color
					strokeWidth: function() { return _this.linkStrokeWidth(this); } // link thickness
				};
				_this.graph.links.push(visualLink); visualLink.source.links.push(visualLink.id); visualLink.target.links.push(visualLink.id);
			});

			//if ('layout' in data) this.layout = data.layout;

			var rawNodes = []; _this.graph.nodes.forEach(function(node) { rawNodes.push(node.raw); });
			this.selection(rawNodes);

			this.update();
	};

	// Extra methods
	nodetrix.model.Graph.prototype.highlight = function(nodes) {
			this.graph.nodes.forEach(function(d,i) { if ($.inArray(d.raw, nodes) >= 0) { d.isHighlighted = d.labels = true; } else d.isHighlighted = d.labels = false; });
			this.render();
	};

	nodetrix.model.Graph.prototype.selection = function(nodes) {
			var _this = this;

			this.visualgraph.nodes.splice(0, this.visualgraph.nodes.length); this.visualgraph.links.splice(0, this.visualgraph.links.length);
			this.forcegraph.nodes.splice(0, this.forcegraph.nodes.length); this.forcegraph.links.splice(0, this.forcegraph.links.length);

			this.graph.nodes.filter(function(node,i) { return !nodes || $.inArray(node.raw, nodes) >= 0; }).forEach(function(node) {
				_this.visualgraph.nodes.push(node); _this.forcegraph.nodes.push(node); node.links.forEach(function(link) {
					link = _this.graph.links[link];
					if ( (!nodes || ($.inArray(link.source.raw, nodes) >= 0 && $.inArray(link.target.raw, nodes) >= 0)) && $.inArray(link, _this.visualgraph.links) < 0) { _this.visualgraph.links.push(link); _this.forcegraph.links.push(link); }
				});
			});

			this.update();
	};

	nodetrix.model.Graph.prototype.nodeSize = function(d) { return d.isHighlighted ? this.config.nodeSize * 2.0 : this.config.nodeSize; };

	nodetrix.model.Graph.prototype.nodeColor = function(d) { return this.config.nodeColor; };

	nodetrix.model.Graph.prototype.nodeStroke = function(d) { return this.config.nodeStroke; };

	nodetrix.model.Graph.prototype.nodeStrokeWidth = function(d) { return d.isHighlighted ? this.config.nodeStrokeWidth * 2 : this.config.nodeStrokeWidth; };

	nodetrix.model.Graph.prototype.linkStroke = function(d) { return this.config.linkStroke; };

	nodetrix.model.Graph.prototype.linkStrokeWidth = function(d) { return this.config.linkStrokeWidth; };

	nodetrix.model.Graph.prototype.round = function(d) { return d.sticky ? this.config.round * 0 : d.isHighlighted ? this.config.round * 2 : this.config.round; };

	nodetrix.model.Graph.prototype.clip = function(d) { return  null; };

	nodetrix.model.Graph.prototype.toJSON = function() {
			var _this = this;
			this.graph.nodes.forEach(function(node) { delete node.variable; delete node.bounds; delete node.index; });
			this.graph.links.forEach(function(link) { delete link.source; delete link.target; });
			var serial = JSON.stringify({
				width: this.width,
				height: this.height,
				config: this.config,
				layout: false,
				nodes: this.graph.nodes,
				links: this.graph.links
			});
			this.graph.links.forEach(function(link) { link.source = _this.graph.nodes[link.raw.source]; link.target = _this.graph.nodes[link.raw.target]; });
			this.update();
			return serial;
	};
})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});

/**************************************************************/

(function(nodetrix) {
	if (!nodetrix.d3) nodetrix.d3 = {};

	// Constructor
	nodetrix.d3.Graph = function(id, width, height, config) {
			nodetrix.model.Graph.call(this, id, width, height);
			nodetrix.d3.View.call(this, id, width, height);

			// visual layers
			this.edgesLayer = this.vis.append("g");
			this.nodesLayer = this.vis.append("g");
			this.node = this.nodesLayer.selectAll(".node");
			this.link = this.edgesLayer.selectAll(".link");
	};

	// Inheritance
	for (var proto in nodetrix.model.Graph.prototype) nodetrix.d3.Graph.prototype[proto] = nodetrix.model.Graph.prototype[proto];

	// Resize
	nodetrix.d3.Graph.prototype.resize = function(width, height) {
			nodetrix.d3.Graph.prototype.resize.call(this);
			this.vis.transition().attr("transform", "translate(" + this.zoom.translate() + ") scale(" + this.zoom.scale() + ")");
			this.update();
	};

	// Update
	nodetrix.d3.Graph.prototype.update = function(width, height) {

			this.node = this.node.data(this.visualgraph.nodes, function(d) { return d.id; });
			this.node.enter().append('g').attr("class", "node").append('rect').attr("class", "node-rect");
			this.node.transition().style("opacity", 1.0);
			this.node.exit().transition().style("opacity", 0).remove();

			//var bundle = d3.layout.bundle(); this.line = d3.svg.line.radial().interpolate("bundle").tension(.85).radius(function(d) { return d.y; }).angle(function(d) { return d.x / 180 * Math.PI; });

			//this.link = this.link.data(bundle(this.visualgraph.links), function(d) { return d.source.id+"-"+d.target.id; });
			this.link = this.link.data(this.visualgraph.links, function(d) { return d.source.id+"-"+d.target.id; });
			this.link.enter().append("line").attr("class", "link");
			//this.link.enter().append("path").attr("class", "link");
			this.link.transition().style("opacity", 1);
			this.link.exit().transition().style("opacity", 0).remove();

			//this.nodesLayer.selectAll('.node-images').remove();
			this.images = this.node.append('g').attr("class", "node-images").append("image")
				//.attr("width", function(d) { return d.size(); }).attr("height", function (d) { return d.size(); })
				.attr("xlink:href", function(d) { return d.raw.image; });
				//function(d) { var url = d.raw.image; var simg = this; var img = new Image(); img.onload = function () { simg.setAttribute("width", d.size() / 2.0 ); simg.setAttribute("height", d.size() / 2.0 ); }; return img.src = url; });

			//var _this = this;
			//this.svg.append("defs").append("svg:clipPath")
			//.attr("id", "clip")
			//.append("svg:rect")
			//.attr("id", "clip-rect")
			//.attr("rx", 100).attr("ry", 100)
			//.attr("x", function(d) { return -_this.config.nodeSize/4.0; }).attr("y", function (d) { return -_this.config.nodeSize/4.0; })
			//.attr("x", function(d) { return _this.config.nodeSize/2.0; }).attr("y", function (d) { return _this.config.nodeSize/4.0; })
			//.attr("width", function(d) { return _this.config.nodeSize*1; }).attr("height", function (d) { return _this.config.nodeSize*1; });

			//this.svg.append("defs").append("svg:clipPath")
			//.attr("id", "clip-highlight")
			//.append("svg:rect")
			//.attr("id", "clip-rect")
			//.attr("rx", 10).attr("ry", 10)
			//.attr("x", function(d) { return _this.config.nodeSize/1.0; }).attr("y", function (d) { return _this.config.nodeSize/1.0; })
			//.attr("width", function(d) { return _this.config.nodeSize*4; }).attr("height", function (d) { return _this.config.nodeSize*4; });


			this.node.call(this.d3cola.drag); // node drag interaction

			this.nodeHandler.bind(this.node);

			nodetrix.model.Graph.prototype.update.call(this);
	};

	// Render
	nodetrix.d3.Graph.prototype.render = function(width, height) {
			var _this = this;

			this.graph.nodes.forEach(function(d) {
				d.width = _this.config.nodeSize; d.height = _this.config.nodeSize;
				d.fixed = d.sticky ? true : d.fixed;
				d.highlighted = _this.config.allowHighlight ? d.highlighted : false;
				d.labels = _this.config.allowLabels ? d.labels : false;
			});

			this.node.attr("transform", function(d, i) { return !isNaN(d.x) && !isNaN(d.y) ? "translate("+(d.x-d.size()/2.0)+","+(d.y-d.size()/2.0)+")" : "translate(0,0)"; });
			this.node.selectAll(".node-rect")
				.attr("width", function(d) { return d.size(); }).attr("height", function (d) { return d.size(); })
				.attr("rx", function (d) { return d.round(); }).attr("ry", function (d) { return d.round(); })
				.style("fill", function(d) { return d.fill(); }).style("stroke", function(d) { return d.stroke(); }).style("stroke-width", function(d) { return d.strokeWidth(); });

			this.images
				.attr("clip-path", function(d) { return d.clip(); })
				.attr("transform", function(d) { return "translate("+(-d.size()/2.0)+","+(-d.size()/4.0)+")"; })
				.attr("width", function(d) { return d.size()*2; }).attr("height", function (d) { return d.size()*2; });

			this.nodesLayer.selectAll('.node-label').remove();
			var labels = this.node.filter(function(d) { return d.labels; }).append('g').attr("class", "node-label");
			labels.append("text")
				//.attr("width", function(d) { return d.size(); }).attr("height", function (d) { return d.size(); })
				.text(function(d, i) { return d.raw.name; })
				.attr("text-anchor", "left")
				.attr("dy", function (d) { d.bbox = this.getBBox(); return d.size()+this.getBBox().height; })
				.attr("dx", function (d) { return (d.size()/2.0-d.bbox.width/2.0); })
				//.style("fill", function(d) { return "black"; })
				.style("stroke", function(d) { return d.stroke(); }).style("stroke-width", 0);
			labels.insert("rect", ":first-child")
				.attr("transform", function(d) { return "translate("+(d.size()/2.0-d.strokeWidth()-d.bbox.width/2.0)+","+(d.size()+d.strokeWidth()*0+2)+")"; })
				.attr("width", function(d) { return d.bbox.width+2*d.strokeWidth(); }).attr("height", function (d) { return d.bbox.height; })
				//.style("fill", function(d) { return "white"; })
				.style("stroke", function(d) { return d.stroke(); }).style("stroke-width", function(d) { return 0; });

			this.link.attr("x1", function (d) { return d.source.x; }).attr("y1", function (d) { return d.source.y; }).attr("x2", function (d) { return d.target.x; }).attr("y2", function (d) { return d.target.y; })
			//this.link.each(function(d) { d.source = d[0], d.target = d[d.length - 1]; }).attr("d", line)
			.style("stroke", function(d) { return d.stroke(); }).style("stroke-width", function(d) { return d.strokeWidth(); });

			nodetrix.model.Graph.prototype.render.call(this);
	};

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});

/**************************************************************/

(function(nodetrix) {
	if (!nodetrix.three) nodetrix.three = {};

	// Constructor
	nodetrix.three.Graph = function(id, width, height, config) {
		nodetrix.model.Graph.call(this, id, width, height);
		nodetrix.three.View.call(this, id, width, height);

			/*
			d3.timer(function(d) {
			  force.start()
			  mouseNode.x = mousePosition[0], mouseNode.y = mousePosition[1]
			  for(var i = 0; i + 1 < nodes.length; i++) {
			    positions[i * 3] = nodes[i].x - width / 2
			    positions[i * 3 + 1] = - (nodes[i].y - height / 2)
			  }
			  posBuff.needsUpdate = true // Important!
			  renderer.render(scene, camera)
			})

			d3.select('canvas')
			  .on('mousemove', updateMouse)
			  .call(d3.behavior.drag().on('drag', updateMouse))

			function updateMouse() {
			  var p = d3.mouse(this)
			  mousePosition = p
			}
			*/
	};

	// Inheritance
	for (var proto in nodetrix.model.Graph.prototype) nodetrix.three.Graph.prototype[proto] = nodetrix.model.Graph.prototype[proto];

	// Resize
	nodetrix.three.Graph.prototype.resize = function(width, height) {
		nodetrix.model.Graph.prototype.resize.call(this);
		//this.vis.transition().attr("transform", "translate(" + this.zoom.translate() + ") scale(" + this.zoom.scale() + ")");
		this.update();
	};

	// Update
	nodetrix.three.Graph.prototype.update = function(width, height) {

			var particles = 1000
			var mouseIdx = 200
			this.positions = new Float32Array(particles * 3)
			var dx = 2
			var norm = d3.random.normal(0, 100)
			for(var i = 0; i < this.positions.length; i+=3) {
					var x = norm(), y = norm(), z = norm()
					if (i / 3 < particles / 3) x -= 0.5, y += 1, z -= 0.5
					else if (i / 3 < particles / 3 * 2) x += dx, y += dx, z += dx
					else x -= dx, y -= dx, z -= dx
					this.positions[i] = x, this.positions[i + 1] = y, this.positions[i + 2] = z;
			}

			var sizes = new Float32Array(particles)
			for(var i = 0; i < particles; i++) sizes[i] = Math.random() * 10 + 3

			this.nodes = d3.range(particles).map(function(d) { return {} });

			this.d3cola = d3.layout.force().size([this.width, this.height])
			.nodes(this.nodes).charge(function(d, i) { return -sizes[i] || -500 })

			this.posBuff = new THREE.BufferAttribute(this.positions, 3)

			var cloudGeom = new THREE.BufferGeometry();
			cloudGeom.addAttribute('position', this.posBuff);
			cloudGeom.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
			cloudGeom.computeBoundingSphere();

			var cloudMat = new THREE.PointCloudMaterial({ color: 0x3498db, size: 10.0, sizeAttenuation: false });

			this.scene.add(new THREE.PointCloud(cloudGeom, cloudMat))

			nodetrix.model.Graph.prototype.update.call(this);
	};

	// Render
	nodetrix.three.Graph.prototype.render = function(width, height) {

			var _this = this;

			//mouseNode.x = mousePosition[0], mouseNode.y = mousePosition[1]

			for(var i = 0; i + 1 < this.nodes.length; i++) {
				this.positions[i * 3] = this.nodes[i].x - this.width / 2;
				this.positions[i * 3 + 1] = - (this.nodes[i].y - this.height / 2);
			}
			this.posBuff.needsUpdate = true; // Important!
			this.renderer.render(this.scene, this.camera);

			nodetrix.model.Graph.prototype.render.call(this);
	};

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});
