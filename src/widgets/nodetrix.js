
(function()
{
	/**
	* NodeTrix definition.
	* @name NodeTrix
	* @class NodeTrix
	* @namespace multiviz
	*/

	/**
	* Represents a NodeTrix.
	* @constructor
	* @inherits Graph
	* @param {string} rootID - root svg id.
	* @param {string} config - config.
	*/
	window.nodetrix.NodeTrix = function(rootID, width, height, config) {
		window.nodetrix.Graph.call(this, rootID, width, height, config);

		// default visual properties
		this.config.cellSize = config && 'cellsize' in config ? config.cellsize : 10;
		this.config.cellColor = config && 'cellcolor' in config ? config.cellcolor : "#FFFFFF";
		this.config.cellColorLink = config && 'cellcolorlink' in config ? config.cellcolorlink : "#000000";
		this.config.cellColorDiag = config && 'cellcolordiag' in config ? config.cellcolordiag : "#0000FF";
		this.config.cellStroke = config && 'cellstroke' in config ? config.cellstroke : "lightGray"; //"#0000FF";
		this.config.cellStrokeWidth = config && 'cellstrokewidth' in config ? config.cellstrokewidth : 1;

		this.config.margin = config && 'margin' in config ? config.margin : 30;
		this.config.bridgeStroke = config && 'bridgestroke' in config ? config.bridgestroke : "lightGray"; //"#0000FF";
		this.config.bridgeStrokeWidth = config && 'bridgestrokewidth' in config ? config.bridgestrokewidth : 1;
		this.config.ordering = config && 'ordering' in config ? config.ordering : 'none';
		this.config.allowLabels = config && 'allowlabels' in config ? config.allowlabels : true;

		// data model
		this.submatrix = [];
		this.viewmatrix = [];
		this.viewbridges = [];
		this.index = {};

		// visual layers
		this.layer.style("stroke", "gray").style("stroke-width", 1).attr("rx", 15).attr("ry", 15);
		this.matrix = this.nodesLayer.selectAll(".matrix");
		this.bridge = this.edgesLayer.selectAll(".bridge");

		this.line = d3.svg.line().x(function(d) { return d.x; }).y(function(d) { return d.y; }).interpolate("basis");

		this.matrixHandler = new window.d3Handler(this);
	};

	// Inheritance
	for (var proto in window.nodetrix.Graph.prototype) window.nodetrix.NodeTrix.prototype[proto] = window.nodetrix.Graph.prototype[proto];

	window.nodetrix.NodeTrixIDFactory = { count: -1, get: function() { this.count++; return this.count; } };

	/**
	 * This method recenters the view.
	 */
	window.nodetrix.NodeTrix.prototype.recenter = function() {
		var x = Number.POSITIVE_INFINITY, X = Number.NEGATIVE_INFINITY, y = Number.POSITIVE_INFINITY, Y = Number.NEGATIVE_INFINITY;
		this.node.each(function (v) { x = Math.min(x, v.x - v.width / 2); X = Math.max(X, v.x + v.width / 2); y = Math.min(y, v.y - v.height / 2); Y = Math.max(Y, v.y + v.height / 2); });
		this.matrix.each(function (v) { x = Math.min(x, v.x - v.width / 2); X = Math.max(X, v.x + v.width / 2); y = Math.min(y, v.y - v.height / 2); Y = Math.max(Y, v.y + v.height / 2); });
		var w = X - x, h = Y - y, cw = this.width-2*this.config.margin, ch = this.height-2*this.config.margin, s = Math.min(cw / w, ch / h), tx = (-x * s + (cw / s - w) * s / 2), ty = (-y * s + (ch / s - h) * s / 2);
		return { translate: [tx+this.config.margin, ty+this.config.margin], scale: s };
	};


	/**
	 * This method binds data
	 */
	window.nodetrix.NodeTrix.prototype.bind = function(data, labels, clustering) {
		window.nodetrix.Graph.prototype.bind.call(this, data);

/*
		this.svg.append("defs").append("svg:clipPath")
			.attr("id", "clip")
			.append("svg:rect")
			.attr("id", "clip-rect")
			.attr("rx", 100).attr("ry", 100)
			//.attr("x", function(d) { return -_this.config.nodeSize/4.0; }).attr("y", function (d) { return -_this.config.nodeSize/4.0; })
			.attr("x", function(d) { return $.context.widgets.nodetrix.config.nodeSize/2.0; })
			.attr("y", function (d) { return $.context.widgets.nodetrix.config.nodeSize/4.0; })
			.attr("width", function(d) { return $.context.widgets.nodetrix.config.nodeSize*1; })
			.attr("height", function (d) { return $.context.widgets.nodetrix.config.nodeSize*1; });
		this.svg.append("defs").append("svg:clipPath")
			.attr("id", "clip-highlight")
			.append("svg:rect")
			.attr("id", "clip-rect")
			.attr("rx", 10).attr("ry", 10)
			//.attr("x", function(d) { return _this.config.nodeSize/1.0; }).attr("y", function (d) { return _this.config.nodeSize/1.0; })
			.attr("width", function(d) { return $.context.widgets.nodetrix.config.nodeSize*4; })
			.attr("height", function (d) { return $.context.widgets.nodetrix.config.nodeSize*4; });
		this.clip = function(d) { d.isHighlighted ? "url(#clip-highlight)" : "url(#clip)" };
*/

		var _this = this;
		this.labels = labels;
		this.clustering = clustering;
		if ('matrix' in data) data.matrix.forEach(function(d) { _this.createNodetrix(d.cluster, d.x, d.y); });
	};

	/**
	 * This method updates the different layers
	 */
	window.nodetrix.NodeTrix.prototype.update = function() {
		var _this = this;

		this.matrix = this.matrix.data(this.viewmatrix, function(d) { return d.id; });
		this.matrix.enter().append('g').attr("class", "matrix").each(function(nodetrix) {
			var submatrix = nodetrix.getSubmatrix();
			var matrix = new window.nodetrix.SubMatrix(d3.select(this));
			matrix.config = _this.config;
			matrix.fill = function(cell) { return cell.x == cell.y ? _this.nodeColor(submatrix[cell.y][cell.x].node) : cell.z ? matrix.config.cellColorLink : matrix.config.cellColor; };
			matrix.strokeWidth = function(cell) { return cell.x == cell.y ? submatrix[cell.y][cell.x].node.isHighlighted ? matrix.config.cellStrokeWidth * 1 : matrix.config.cellStrokeWidth : matrix.config.cellStrokeWidth; };
			matrix.cellHandler = _this.matrixHandler;

			var ordering = { labels: d3.range(submatrix.length), clustering: d3.range(submatrix.length) };
			var idx = 0, nodes = []; nodetrix.subgraph.nodes.forEach(function(d) { nodes.push(d.raw); });
			Object.keys(_this.clustering).forEach(function(key) { _this.clustering[key].forEach(function(d) { var i = $.inArray(d, nodes); if (i >= 0) { ordering.labels[idx] = i; idx++; } }); });

			var adjacency = submatrix.map(function(row) { return row.map(function(cell) { return cell.x == cell.y ? 0 : cell.z; }); });
			var leafOrder = reorder.leafOrder().distance(science.stats.distance.manhattan)(adjacency);
			leafOrder.forEach(function(lo, i) { ordering.clustering[i] = lo; });

			var labels = []; nodetrix.subgraph.nodes.forEach(function(d) { labels.push(_this.labels[$.inArray(d, _this.graph.nodes)]); });

			matrix.bind(submatrix, labels, ordering);

			nodetrix.matrix = matrix;
		});
		this.matrix.transition().style("opacity", 1);
		this.matrix.exit().transition().style("opacity", 0).remove();

		this.viewmatrix.forEach(function(nodetrix) { nodetrix.matrix.update(); });

		this.bridge = this.bridge.data(this.viewbridges, function(d) { return d.id; });
		this.bridge.enter().append("svg:path").attr("class", "bridge");
		this.bridge.transition().style("opacity", 1);
		this.bridge.exit().transition().style("opacity", 0).remove();

		this.matrix.call(this.d3cola.drag);  // node drag interaction

		window.nodetrix.Graph.prototype.update.call(this);
	};

	/**
	 * This method renders the different layers
	 */
	window.nodetrix.NodeTrix.prototype.render = function() {
		window.nodetrix.Graph.prototype.render.call(this);

		function updateAncor(nodeMatrix, anchorIndex, theta, margin, ancor, pivot) {
			ancor.x = nodeMatrix.x - nodeMatrix.nodeSize/2.0;
			ancor.y = nodeMatrix.y - nodeMatrix.nodeSize/2.0;
			var delta = anchorIndex * nodeMatrix.nodeSize / nodeMatrix.subgraph.nodes.length + nodeMatrix.nodeSize / (2.0 * nodeMatrix.subgraph.nodes.length);
			if (theta >= 0 && theta < 90) { ancor.x += nodeMatrix.nodeSize; ancor.y += delta; pivot.x = ancor.x + margin; pivot.y = ancor.y; }
			if (theta >= 90 && theta < 180) { ancor.x += delta; ancor.y += nodeMatrix.nodeSize; pivot.x = ancor.x; pivot.y = ancor.y + margin; }
			if (theta >= 180 && theta < 270) { ancor.y += delta; pivot.x = ancor.x - margin; pivot.y = ancor.y; }
			if (theta >= 270 && theta < 360) { ancor.x += delta; pivot.x = ancor.x; pivot.y = ancor.y - margin; }
		}

		var _this = this;

		this.viewmatrix.forEach(function(d) { d.nodeSize = d.cluster.length * _this.config.cellSize; d.width = d.nodeSize + _this.config.margin; d.height = d.nodeSize + _this.config.margin; d.matrix.render(); });

		this.matrix.attr("transform", function(d, i) { return !isNaN(d.x) && !isNaN(d.y) ? "translate("+(d.x-d.nodeSize/2.0)+","+(d.y-d.nodeSize/2.0)+")" : "translate(0,0)"; });

		this.bridge.attr("d", function (d) {
			var sourceAncor = { x: d.source.x, y: d.source.y }, sourcePivot = { x: d.source.x, y: d.source.y }, targetAncor = { x: d.target.x, y: d.target.y }, targetPivot = { x: d.target.x, y: d.target.y };
			var dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dr = Math.sqrt(dx * dx + dy * dy), theta = dx !== 0 ? Math.atan(dy / dx) / (Math.PI/180.0) : dy >= 0 ? 90 : 270; theta = dx < 0 ? theta+180 : dy < 0 ? theta+360 : theta; theta = (theta + 45) % 360;
			if ('subgraph' in d.source) { updateAncor(d.source, $.inArray($.inArray(d.originalSource, d.source.subgraph.nodes), d.source.matrix.scale.domain()), theta, _this.config.margin, sourceAncor, sourcePivot); }
			if ('subgraph' in d.target) { updateAncor(d.target, $.inArray($.inArray(d.originalTarget, d.target.subgraph.nodes), d.target.matrix.scale.domain()), (theta + 180) % 360, _this.config.margin, targetAncor, targetPivot); }
			return _this.line([sourceAncor, sourcePivot, targetPivot, targetAncor]);
		}).style("fill", "transparent").style("stroke", function(d) { return _this.bridgeStroke(d); }).style("stroke-width", function(d) { return _this.bridgeStrokeWidth(d); });
	};

	/**
	* This method creates a nodetrix.
	* @returns {NodeMatrix} nodeMatrix
	*/
	window.nodetrix.NodeTrix.prototype.createNodetrix = function(cluster, x, y) {
		var _this = this;
		//this.d3cola.stop(); this.d3cola.on("tick", null);

		if (cluster.length > 1) {

			var reverseCreation = false, computeLocation = x === undefined || y === undefined ? true : false;
			if (computeLocation) { x = 0; y = 0; }
			for (var k = 0; k < cluster.length; k++) {
				var visualnode = this.graph.nodes[cluster[k]];
				if (computeLocation) { x += visualnode.x; y += visualnode.y; }
				if (visualnode.id in this.index) {
					var oldNodeMatrix = this.index[visualnode.id];
					var flag = true;
					for (var l = 0; l < oldNodeMatrix.subgraph.nodes.length; l++) { if ($.inArray(oldNodeMatrix.subgraph.nodes[l].id, cluster) < 0) { flag = false; } }
					this.deleteNodetrix(oldNodeMatrix);
					if (flag && cluster.length == oldNodeMatrix.subgraph.nodes.length) { reverseCreation = true; break; }
				}
			}
			if (reverseCreation) return null;
			if (computeLocation) { x /= cluster.length; y /= cluster.length; }

			var nodeMatrix = {
				links: [],
				id: _this.graph.nodes.length+window.nodetrix.NodeTrixIDFactory.get(),// >> node id should be unique during the whole program because we use the same viewmatrix array to create svg nodes
				sticky: false, fixed: false, // indicates if the node is fixed in the force layout
				x: x, y: y, // position in the force layout
				cluster: cluster,
				nodeSize: cluster.length * _this.config.cellSize,
				width: cluster.length * _this.config.cellSize + _this.config.margin, height: cluster.length * _this.config.cellSize + _this.config.margin, // size of the box to avoid overlap in d3cola and visual size
				subgraph: { nodes: [], links: [] },
				getSubmatrix: function() {
					var data = [], obj = this;
					this.subgraph.nodes.forEach(function(d, i) { data[i] = d3.range(obj.subgraph.nodes.length).map(function(j) { return { x: j, y: i, z: 0, parent: obj }; }); data[i][i].z = 1; data[i][i].node = obj.subgraph.nodes[i]; });
					this.subgraph.links.forEach(function(link) {
						var source = $.inArray(link.source, obj.subgraph.nodes); var target = $.inArray(link.target, obj.subgraph.nodes);
						if (source < 0 || target < 0) throw "Linking error: from "+source+" to "+target;
						data[source][target].z += link.raw.value; data[target][source].z += link.raw.value;
					});
					return data;
				}
			};

			this.viewmatrix.push(nodeMatrix); this.forcegraph.nodes.push(nodeMatrix);

			var nodesToRemove = [], edgesToRemove = [];
			for (var i = 0; i < cluster.length; i++) {
				if (cluster[i] < this.graph.nodes.length) {
					var node = this.graph.nodes[cluster[i]]; nodesToRemove.push(node); nodeMatrix.subgraph.nodes.push(node); this.index[node.id] = nodeMatrix;
					for (var j = 0; j < node.links.length; j++) {
						var edge = _this.graph.links[node.links[j]];
						if ($.inArray(edge.source.id, cluster) < 0 && $.inArray(edge.target.id, cluster) < 0) { throw "Linking crash"; }
						else if ($.inArray(edge.source.id, cluster) >= 0 && $.inArray(edge.target.id, cluster) >= 0) {  if ($.inArray(edge, edgesToRemove) < 0) { edgesToRemove.push(edge); nodeMatrix.subgraph.links.push(edge); } }
						else
						{
							if ($.inArray(edge.source.id, cluster) >= 0 && $.inArray(edge.target.id, cluster) < 0) { edge.originalSource = edge.source; edge.source = nodeMatrix; }
							if ($.inArray(edge.target.id, cluster) >= 0 && $.inArray(edge.source.id, cluster) < 0) { edge.originalTarget = edge.target; edge.target = nodeMatrix; }
							if ($.inArray(edge, _this.visualgraph.links) >= 0) _this.visualgraph.links.splice(_this.visualgraph.links.indexOf(edge), 1);
							if ($.inArray(edge, _this.forcegraph.links) >= 0) _this.forcegraph.links.splice(_this.forcegraph.links.indexOf(edge), 1);
							if ($.inArray(edge, _this.viewbridges) < 0) _this.viewbridges.push(edge);
							nodeMatrix.links.push(edge.id);
						}
					}
				}
			}

			while (edgesToRemove.length > 0) { var edgeToRemove = edgesToRemove.pop(); this.forcegraph.links.splice(this.forcegraph.links.indexOf(edgeToRemove), 1); this.visualgraph.links.splice(this.visualgraph.links.indexOf(edgeToRemove), 1); }
			while (nodesToRemove.length > 0) { var nodeToRemove = nodesToRemove.pop(); this.forcegraph.nodes.splice(this.forcegraph.nodes.indexOf(nodeToRemove), 1); this.visualgraph.nodes.splice(this.visualgraph.nodes.indexOf(nodeToRemove), 1); }

			this.update();

			return nodeMatrix;
		}
		else return null;
	};

	/**
	 * This method destroy a nodetrix.
	 */
	window.nodetrix.NodeTrix.prototype.deleteNodetrix = function(nodeMatrix) {
		var _this = this;
		this.forcegraph.nodes.splice(_this.forcegraph.nodes.indexOf(nodeMatrix), 1);
		this.viewmatrix.splice(this.viewmatrix.indexOf(nodeMatrix), 1);
		nodeMatrix.subgraph.nodes.forEach(function(d) { d.fixed = false; _this.forcegraph.nodes.push(d); _this.visualgraph.nodes.push(d); delete _this.index[d.id]; });
		nodeMatrix.subgraph.links.forEach(function(d) { _this.forcegraph.links.push(d); _this.visualgraph.links.push(d); });
		nodeMatrix.links.forEach(function(edge) {
			edge = _this.graph.links[edge];
			if (edge.source == nodeMatrix) { edge.source = edge.originalSource; delete edge.originalSource; if (!('subgraph' in edge.target)) { _this.viewbridges.splice(_this.viewbridges.indexOf(edge), 1); _this.visualgraph.links.push(edge); _this.forcegraph.links.push(edge); } }
			if (edge.target == nodeMatrix) { edge.target = edge.originalTarget; delete edge.originalTarget; if (!('subgraph' in edge.source)) { _this.viewbridges.splice(_this.viewbridges.indexOf(edge), 1); _this.visualgraph.links.push(edge); _this.forcegraph.links.push(edge); } }
		});
		this.update();
	};

	/**
	 * This method returns the stroke of the links
	 */
	window.nodetrix.NodeTrix.prototype.bridgeStroke = function(d) { return this.config.bridgeStroke; };

	/**
	 * This method returns the stroke-width of the links
	 */
	window.nodetrix.NodeTrix.prototype.bridgeStrokeWidth = function(d) { return this.config.bridgeStrokeWidth; };

	/**
	 * This method serialize the visual graph.
	 */
	window.nodetrix.NodeTrix.prototype.toJSON = function() {
		var _this = this;
		this.graph.nodes.forEach(function(node) { delete node.variable; delete node.bounds; delete node.index; });
		var links = []; this.graph.links.forEach(function(link) { links.push(link.raw); });
		var matrix = []; this.viewmatrix.forEach(function(nodematrix) { matrix.push({ cluster: nodematrix.cluster, x: nodematrix.x, y: nodematrix.y }); });
		var serial = JSON.stringify({
			width: this.width,
			height: this.height,
			config: this.config,
			layout: false,
			nodes: this.graph.nodes,
			links: links,
			matrix : matrix
		});
		this.update();
		return serial;
	};

}
( (window.nodetrix = window.nodetrix || {}) ));
