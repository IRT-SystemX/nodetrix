(function(nodetrix) {
	if (!nodetrix.model) nodetrix.model = {};

	// Constructor
	nodetrix.model.Graph = function(id, width, height, config) {
		nodetrix.model.View.call(this, id, width, height);

		// default visual properties
		this.config = {
			nodeSize: config && 'nodesize' in config ? config.nodesize : 10,
			nodeColor: config && 'nodecolor' in config ? config.nodecolor : "#D3D3D3",
			nodeStroke: config && 'nodestroke' in config ? config.nodestroke : "#808080",
			nodeStrokeWidth: config && 'nodestrokewidth' in config ? config.nodestrokewidth : 1,
			linkStroke: config && 'linkstroke' in config ? config.linkstroke : "#D3D3D3",
			linkStrokeWidth: config && 'linkstrokewidth' in config ? config.linkstrokewidth : 1,

			linkDistance: config && 'linkdistance' in config ? config.linkdistance : 60,

			round: config && 'round' in config ? config.round : 5,
			allowHighlight: config && 'allowhighlight' in config ? config.allowhighlight : true,
			allowLabels: config && 'allowlabels' in config ? config.allowlabels : true,
			allowLayout: config && 'allowlayout' in config ? config.allowlayout : true
		};

		// data model
		this.graph = { nodes: [], links: [] };
		this.visualgraph = { nodes: [], links: [] }; // it contains the visible parts of the graph
		this.forcegraph = { nodes: [], links: [] }; // it contains the force based parts of the graph

		// force layout
		//this.d3cola = cola.d3adaptor().linkDistance(this.config.linkDistance).size([this.width, this.height]).avoidOverlaps(true).nodes(this.forcegraph.nodes).links(this.forcegraph.links); //.convergenceThreshold(0.1);
		this.d3cola = d3.layout.force().charge(-120).linkDistance(30).size([width, height]);

		this.nodeHandler = new nodetrix.Handler(this);
	};

	// Inheritance
	for (var proto in nodetrix.model.View.prototype) nodetrix.model.Graph.prototype[proto] = nodetrix.model.View.prototype[proto];

	// Recenter
	nodetrix.model.Graph.prototype.recenter = function() {
		var x = Number.POSITIVE_INFINITY, X = Number.NEGATIVE_INFINITY, y = Number.POSITIVE_INFINITY, Y = Number.NEGATIVE_INFINITY;
		this.visualgraph.nodes.forEach(function (v) { x = Math.min(x, v.x - v.width / 2); X = Math.max(X, v.x + v.width / 2); y = Math.min(y, v.y - v.height / 2); Y = Math.max(Y, v.y + v.height / 2); });
		var w = X - x, h = Y - y, cw = this.width, ch = this.height, s = Math.min(cw / w, ch / h), tx = (-x * s + (cw / s - w) * s / 2), ty = (-y * s + (ch / s - h) * s / 2);
		return { translate: [tx, ty], scale: s };
	};

	// Resize
	nodetrix.model.Graph.prototype.resize = function(width, height) {
		nodetrix.model.View.prototype.resize.call(this);

		this.d3cola.size([this.width, this.height]);

		this.zoom.translate(correction.translate).scale(correction.scale);
	};

	// Update
	nodetrix.model.Graph.prototype.update = function() {
		nodetrix.model.View.prototype.update.call(this);

		if (this.config.allowLayout) {
			var _this = this;
			this.d3cola.nodes(this.forcegraph.nodes).links(this.forcegraph.links);
			this.d3cola.on("tick", function() { _this.render(); });
			this.d3cola.start();
		}
	};

	// Render
	nodetrix.model.Graph.prototype.render = function() {
		nodetrix.model.View.prototype.render.call(this);
	};


	// Data binding
	nodetrix.model.Graph.prototype.bind = function(data) {
		this.rawGraph = data;
		this.graph.nodes.splice(0, this.graph.nodes.length);
		this.graph.links.splice(0, this.graph.links.length);

		var _this = this;
		data.nodes.forEach(function(node, i) {
			var visualNode = {
				raw: 'raw' in node ? node.raw : node, // raw node
				id: i, //'id' in node ? node.id : i, // node id
				fixed: 'fixed' in node ? node.fixed : false, // indicates if the node is fixed in the force layout
				x: 'x' in node ? node.x : _this.width/2, y: 'y' in node ? node.y : _this.height/2, // position in the force layout
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
		this.d3cola.stop();

		var rawNodes = []; _this.graph.nodes.forEach(function(node) { rawNodes.push(node.raw); });
		this.selection(rawNodes);

		this.update();
	};

	// Extra methods
	nodetrix.model.Graph.prototype.highlight = function(nodes) {
		this.graph.nodes.forEach(function(d,i) { if ($.inArray(d.raw, nodes) >= 0) { d.isHighlighted = d.labels = true; } else { d.isHighlighted = d.labels = false; } });
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

	nodetrix.model.Graph.prototype.nodeColor = function(d) { return d3.rgb(this.config.nodeColor); };

	nodetrix.model.Graph.prototype.nodeStroke = function(d) { return d3.rgb(this.config.nodeStroke); };

	nodetrix.model.Graph.prototype.nodeStrokeWidth = function(d) { return d.isHighlighted ? this.config.nodeStrokeWidth * 2 : this.config.nodeStrokeWidth; };

	nodetrix.model.Graph.prototype.linkStroke = function(d) { return d3.rgb(this.config.linkStroke); };

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
		nodetrix.d3.View.call(this, id, width, height);
		nodetrix.model.Graph.call(this, id, width, height, config);

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

	nodetrix.d3.Graph.prototype.bind = function(data) {
		this.nodesLayer.selectAll(".node").remove();
		this.edgesLayer.selectAll(".link").remove();

		this.node = this.nodesLayer.selectAll(".node");
		this.link = this.edgesLayer.selectAll(".link");

		nodetrix.model.Graph.prototype.bind.call(this, data);
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

		if (this.images) this.images
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
	if (!nodetrix.gl) nodetrix.gl = {};

	// Constructor
	nodetrix.gl.Graph = function(id, width, height, config) {
		nodetrix.gl.View.call(this, id, width, height);
		nodetrix.model.Graph.call(this, id, width, height, config);

		this.raycaster.params.PointCloud.threshold = this.config.nodeSize*2 / 2.0;
	};

	// Inheritance
	for (var proto in nodetrix.model.Graph.prototype) nodetrix.gl.Graph.prototype[proto] = nodetrix.model.Graph.prototype[proto];

	// Resize
	nodetrix.gl.Graph.prototype.resize = function(width, height) {
		nodetrix.model.Graph.prototype.resize.call(this);
		//this.vis.transition().attr("transform", "translate(" + this.zoom.translate() + ") scale(" + this.zoom.scale() + ")");
		this.update();
	};

	function generateSprite() {
		var canvas = document.createElement( 'canvas' );
		canvas.width = 128; canvas.height = 128;
		var context = canvas.getContext( '2d' );
		var centerX = canvas.width / 2.0, centerY = canvas.height / 2.0;
		var radius = canvas.width / 4.0;
		context.beginPath();
		context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		context.fillStyle = 'rgba(255,255,255,1)';
		context.fill();
		context.lineWidth = canvas.width / 10.0;
		context.strokeStyle = '#000000';
		context.stroke();
		var texture = new THREE.Texture(canvas);
		texture.needsUpdate = true;
		return texture;
	}

	// Update
	nodetrix.gl.Graph.prototype.update = function() {
		var _this = this;

		if (! this.buffers) {
			this.buffers = {
				nodes: {
					positions: new THREE.BufferAttribute(new Float32Array(this.visualgraph.nodes.length * 3), 3),
					colors: new THREE.BufferAttribute(new Float32Array(this.visualgraph.nodes.length * 3), 3),
					sizes: new THREE.BufferAttribute(new Float32Array(this.visualgraph.nodes.length), 1)
				},
				links: {
					positions: new THREE.BufferAttribute(new Float32Array(this.visualgraph.links.length * 6), 3),
					colors: new THREE.BufferAttribute(new Float32Array(this.visualgraph.links.length * 6), 3)
				}
			};

			var uniforms = { rawsize: { type: "f", value: this.config.nodeSize }, texture: { type: "t", value: generateSprite() } };
			var vertexShader = "attribute float size; uniform float rawsize; varying vec3 vColor; void main() { vColor = color; gl_PointSize = size; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }";
			var fragmentShader = "uniform sampler2D texture; varying vec3 vColor; void main() { gl_FragColor = vec4(vColor, 1.0) * texture2D(texture, gl_PointCoord); }";

			var geometry = new THREE.BufferGeometry();
			geometry.addAttribute('position', this.buffers.nodes.positions);
			geometry.addAttribute('color', this.buffers.nodes.colors);
			geometry.addAttribute('size', this.buffers.nodes.sizes);
			var material = new THREE.ShaderMaterial({
				vertexColors: THREE.VertexColors, size: 0.05, sizeAttenuation: true, opacity: 1.0, transparent: true,
				attributes: { size: { type: 'f', value: [] } }, uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader
			});
			this.nodes = new THREE.PointCloud(geometry, material);

			geometry = new THREE.BufferGeometry();
			geometry.addAttribute('position', this.buffers.links.positions);
			geometry.addAttribute('color', this.buffers.links.colors);
			material = new THREE.LineBasicMaterial({ linewidth: 1, vertexColors: THREE.VertexColors, dashSize: 0, gapSize: 0 });
			this.links = new THREE.Line(geometry, material, THREE.LinePieces);

			//this.scene.add(new THREE.Mesh( new THREE.BoxGeometry(_this.width, _this.height*4, 0), new THREE.MeshBasicMaterial({ color: 0xff0000 })));

			this.scene.add(this.links);
			this.scene.add(this.nodes);
		}

		if (!this.animate) {
			if (!this.config.allowLayout && !this.animate) {
				this.animate = function () {
					requestAnimationFrame(_this.animate);
					_this.renderer.render(_this.scene, _this.camera);
				};
				this.animate();
			} else {
				this.d3cola.nodes(this.forcegraph.nodes).links(this.forcegraph.links);
				this.animate = function () {
					requestAnimationFrame(_this.animate);
					_this.renderer.render(_this.scene, _this.camera);
				};
				this.animate();
				this.d3cola.on("tick", function() {	_this.render();	});
				this.d3cola.start();
			}
		}

		var last = null, dx = 0, dy = 0;
		d3.select(this.id)
		.on('mousemove', function() {
			_this.mouse.x = ( d3.mouse(this)[0] / _this.width ) * 2 - 1;
			_this.mouse.y = - ( d3.mouse(this)[1] / _this.height ) * 2 + 1;
			_this.raycaster.setFromCamera(_this.mouse, _this.camera);
			var intersects = _this.raycaster.intersectObject(_this.nodes); //_this.scene.children);
			if ( intersects.length > 0 ) { last = _this.visualgraph.nodes[intersects[0].index]; if (last) _this.handler.mouseover(last); }
			else { if (last) _this.handler.mouseout(last); last = null; }
		})
		.call(d3.behavior.drag().on('drag', function() { if (last != null) { last.x = d3.event.x; last.y = _this.height-d3.event.y; } _this.render(); })); // TODO: fix zoom/translate

		this.nodeHandler.bind(_this.handler);
	};

	// Render
	nodetrix.gl.Graph.prototype.render = function() {
		var _this = this;

		this.visualgraph.nodes.forEach(function(d, i) {
			_this.buffers.nodes.positions.array[3*i] = (d.x-_this.width/4.0)+_this.translate[0]; _this.buffers.nodes.positions.array[3*i+1] = (d.y-_this.height/4.0)+_this.translate[1]; _this.buffers.nodes.positions.array[3*i+2] = 0;
			_this.buffers.nodes.colors.array[3*i] = d.fill().r/255.0; _this.buffers.nodes.colors.array[3*i+1] = d.fill().g/255.0; _this.buffers.nodes.colors.array[3*i+2] = d.fill().b/255.0;
			_this.buffers.nodes.sizes.array[i] = d.size()*2;
		});
		this.buffers.nodes.positions.needsUpdate = true;
		this.buffers.nodes.colors.needsUpdate = true;
		this.buffers.nodes.sizes.needsUpdate = true;

		this.visualgraph.links.forEach(function(d, i) {
			_this.buffers.links.positions.array[6*i] = d.source.x-_this.width/4.0+_this.translate[0]; _this.buffers.links.positions.array[6*i+1] = d.source.y-_this.height/4.0+_this.translate[1]; _this.buffers.links.positions.array[6*i+2] = -1;
			_this.buffers.links.positions.array[6*i+3] = d.target.x-_this.width/4.0+_this.translate[0]; _this.buffers.links.positions.array[6*i+4] = d.target.y-_this.height/4.0+_this.translate[1]; _this.buffers.links.positions.array[6*i+5] = -1;
			_this.buffers.links.colors.array[6*i] = d.stroke().r/255.0; _this.buffers.links.colors.array[6*i+1] = d.stroke().g/255.0; _this.buffers.links.colors.array[6*i+2] = d.stroke().b/255.0;
			_this.buffers.links.colors.array[6*i+3] = d.stroke().r/255.0; _this.buffers.links.colors.array[6*i+4] = d.stroke().g/255.0; _this.buffers.links.colors.array[6*i+5] = d.stroke().b/255.0;
		});
		this.buffers.links.positions.needsUpdate = true;
		this.buffers.links.colors.needsUpdate = true;

		nodetrix.model.Graph.prototype.render.call(this);
	};

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});
