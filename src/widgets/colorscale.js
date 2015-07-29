(function() {
	/**
	 * Represents a View.
	 * @constructor
	 * @param {string} root - root div.
	 */
	nodetrix.Clustering = function(rootID, width, height, config) {
		d3View.call(this, rootID, width, height);

		// default visual properties
		this.config = {
			nodeSize: 'nodesize' in config ? config.nodesize : 15,
			nodeStrokeWidth: 'nodestrokewidth' in config ? config.nodestrokewidth : 1,
			colorscale: 'colorscale' in config ? config.colorscale : new nodetrix.colorscale.Category(),
			allowHighlight: 'allowHighlight' in config ? config.allowHighlight : true
		};

		// data model
		this.groups = [];
		this.reversed = {};
		this.selectedGroup = [];

		// visual layers
		//this.layer.style("stroke", "gray").style("stroke-width", 1);
		this.groupLayer = this.vis.append("g");
		this.labelLayer = this.vis.append("g");
		this.group = this.groupLayer.selectAll(".group");
		this.label = this.labelLayer.selectAll(".label");

		this.groupHandler = new d3Handler(this);

		// colorscale properties
		this.precision = 10.0;
		//this.bbox = this.vis.append("svg:text").attr("dy", ".35em").attr("text-anchor", "middle").style("font-size", "12px").style("visibility", "hidden").text("testSize1000").node().getBBox();
	};

	// Inheritance
	for (var proto in d3View.prototype) nodetrix.Clustering.prototype[proto] = d3View.prototype[proto];

	/**
	 * This method recenters the view.
	 */
	nodetrix.Clustering.prototype.resize = function(width, height) { };

	/**
	 * This method binds data
	 */
	nodetrix.Clustering.prototype.bind = function(data) {
		this.groups.splice(0, this.groups.length);
		this.reversed = {};

		var _this = this;
		Object.keys(data).forEach(function(group, i) {
			var visualGroup = {
				items: data[group], // group items
				id: i, // group id
				label: group,
				x: _this.config.nodeSize, y: _this.config.nodeSize + i * Math.round( (_this.height-_this.config.nodeSize*2) / (_this.precision) *100) / 100.0, // position
				isHighlighted: false,
				size: function() { return _this.nodeSize(this); },
				strokeWidth: function() { return _this.nodeStrokeWidth(this); },
				color: function() { return _this.coloring(this.id); }
			};
			_this.groups.push(visualGroup);
			data[group].forEach(function(node, i) { _this.reversed[node.name] = visualGroup; });
		});

		this.update();
	};

	/**
	 * This method updates the different layers
	 */
	nodetrix.Clustering.prototype.update = function() {
		var _this = this;

		this.group = this.group.data(_this.groups, function(d) { return d.id; });
		this.group.enter().append('rect').attr("class", "group" );
		this.group.exit().remove();

		this.label = this.label.data(_this.groups, function(d) { return d.id; });
		this.label.enter().append('text').attr("class", "label" );
		this.label.exit().remove();

		this.groupHandler.bind(this.group);

		this.render();
	};


	/**
	 * This method renders the different layers
	 */
	nodetrix.Clustering.prototype.render = function() {

		this.group.attr("transform", function(d, i) { return !isNaN(d.x) && !isNaN(d.y) ? "translate("+(d.x-d.size()/2.0)+","+(d.y-d.size()/2.0)+")" : "translate(0,0)"; })
			.attr("width", function(d) { return d.size(); }).attr("height", function (d) { return d.size(); }).attr("rx", 0).attr("ry", 0)
			.style("fill", function(d) { return d.color(); }).style("stroke", function(d) { return "black"; }).style("stroke-width", function(d) { return d.strokeWidth(); });

		this.label.attr("x", function(d) { return d.x+d.size(); }).attr("y", function(d) { return d.y; }).attr("dy", ".32em").attr("text-anchor", "left").style("fill", "gray")
		.text(function(d, i) { return d.label; }); //return "cluster n°"+(i+1); });

	};

	/**
	 * This method updates the different layers
	 */
	nodetrix.Clustering.prototype.highlight = function(nodes) {
		var _this = this;

		this.groups.forEach(function(d) { d.isHighlighted = false; });
		this.selectedGroup.splice(0, this.selectedGroup.length);

		if (nodes && Object.keys(_this.reversed).length > 0) nodes.forEach(function(d) { var group = _this.reversed[d.name]; group.isHighlighted = true; if ($.inArray(group, _this.selectedGroup) < 0) _this.selectedGroup.push(group); });

		this.render();
	};

	/**
	 * This method returns the size of the nodes
	 */
	nodetrix.Clustering.prototype.nodeSize = function(d) { return this.config.nodeSize; };

	/**
	 * This method returns the stroke-width of the nodes
	 */
	nodetrix.Clustering.prototype.nodeStrokeWidth = function(d) { return d.isHighlighted ? this.config.nodeStrokeWidth * 3 : this.config.nodeStrokeWidth; };

	/**
	 * This method returns the coloring
	 */
	nodetrix.Clustering.prototype.coloring = function(val) { return this.config.colorscale ? this.config.colorscale.get(1-val) : d3.rgb("white"); };

}
( (nodetrix = nodetrix || {}) && (nodetrix = nodetrix || {}) ));



(function()
{
	/**
	 * Represents a View.
	 * @constructor
	 * @param {string} root - root div.
	 */
	nodetrix.Colorscale = function(rootID, width, height, config) {
		d3View.call(this, rootID, width, height);

		// default visual properties
		this.config = {
			nodeSize: 'nodesize' in config ? config.nodesize : 1,
			colorscale: 'colorscale' in config ? config.colorscale : new nodetrix.colorscale.Gray(0, 220)
		};

		// data model
		this.groups = [];
		this.reversed = {};
		this.selectedGroup = [];

		// visual layers
		//this.layer.style("stroke", "gray").style("stroke-width", 1);
		this.groupLayer = this.vis.append("g");
		this.labelLayer = this.vis.append("g");
		this.group = this.groupLayer.selectAll(".group");
		this.label = this.labelLayer.selectAll(".label");

		this.groupHandler = new d3Handler(this);

		// colorscale properties
		this.precision = 10.0;
		//this.bbox = this.vis.append("svg:text").attr("dy", ".35em").attr("text-anchor", "middle").style("font-size", "12px").style("visibility", "hidden").text("testSize1000").node().getBBox();
	};

	// Inheritance
	for (var proto in d3View.prototype) nodetrix.Colorscale.prototype[proto] = d3View.prototype[proto];

	/**
	 * This method recenters the view.
	 */
	nodetrix.Colorscale.prototype.resize = function(width, height) { };

	/**
	 * This method binds data
	 */
	nodetrix.Colorscale.prototype.bind = function(data) {
		this.groups.splice(0, this.groups.length);
		this.reversed = {};

		var _this = this;
		Object.keys(data).forEach(function(group, i) {
			var visualGroup = {
				items: data[group], // group items
				id: i, // group id
				label: group,
				x: _this.config.nodeSize, y: _this.config.nodeSize + i * Math.round( (_this.height-_this.config.nodeSize*2) / (_this.precision) *100) / 100.0, // position
				isHighlighted: false,
				size: function() { return _this.nodeSize(this); },
				strokeWidth: function() { return _this.nodeStrokeWidth(this); },
				color: function() { return _this.coloring(this.id); }
			};
			_this.groups.push(visualGroup);
			data[group].forEach(function(node, i) { _this.reversed[node.name] = visualGroup; });
		});

		this.update();
	};

	/**
	 * This method updates the different layers
	 */
	nodetrix.Colorscale.prototype.update = function() {
		var _this = this;

		this.group = this.group.data(_this.groups, function(d) { return d.id; });
		this.group.enter().append('rect').attr("class", "group" );
		this.group.exit().remove();

		this.label = this.label.data(_this.groups, function(d) { return d.id; });
		this.label.enter().append('text').attr("class", "label" );
		this.label.exit().remove();

		this.groupHandler.bind(this.group);

		this.render();
	};


	/**
	 * This method renders the different layers
	 */
	nodetrix.Colorscale.prototype.render = function() {

		this.group.attr("transform", function(d, i) { return !isNaN(d.x) && !isNaN(d.y) ? "translate("+(d.x-d.size()/2.0)+","+(d.y-d.size()/2.0)+")" : "translate(0,0)"; })
			.attr("width", function(d) { return d.size(); }).attr("height", function (d) { return d.size(); }).attr("rx", 0).attr("ry", 0)
			.style("fill", function(d) { return d.color(); }).style("stroke", function(d) { return "black"; }).style("stroke-width", function(d) { return d.strokeWidth(); });

		this.label.attr("x", function(d) { return d.x+d.size(); }).attr("y", function(d) { return d.y; }).attr("dy", ".32em").attr("text-anchor", "left").style("fill", "gray")
		.text(function(d, i) { return d.label; }); //return "cluster n°"+(i+1); });

	};

	/**
	 * This method returns the coloring
	 */
	nodetrix.Colorscale.prototype.coloring = function(val) { return this.config.colorscale ? this.config.colorscale.get(1-val) : d3.rgb("white"); };



	nodetrix.colorscale = nodetrix.colorscale ? nodetrix.colorscale :{};


	nodetrix.colorscale.Hue = function(hueMin, hueMax) {
		return { get: function(value, threshold, precision) { return d3.hsl( (hueMin + (hueMax -hueMin) * (1 - value)) % 360, 1.0, 0.5 ).rgb(); } };
	};

	nodetrix.colorscale.Gray = function() {
		return {
			get: function(value) {
				value = value; //*0.7;
				var x = 0.299 * value * 255 + 0.587 * value * 255 + 0.114 * value * 255;
				return d3.rgb(x, x, x);
			}
		};
	};

	nodetrix.colorscale.Category = function(hue) { /*
		var category20 = [
			"#1f77b4", "#aec7e8",
			"#ff7f0e", "#ffbb78",
			"#2ca02c", "#98df8a",
			"#bcbd22", "#dbdb8d","#ff9896",
			"#d62728"
			/*"#9467bd", "#c5b0d5"
			/*"#8c564b", "#c49c94",
			"#e377c2", "#f7b6d2",
			"#7f7f7f", "#c7c7c7",
			"#17becf", "#9edae5"
		];
		var ddd_category10 = [
			ff7f0e",	"#7f7f7f", "#bcbd22", "#17becf", "#e377c2", "#d62728", "#9467bd", "#8c564b", "#1f77b4", "#2ca02c"
		]; */
		var scale_category10 = [ "orange", "green", "#9467bd","blue", "red", "yellow", "#8c564b", "#1f77b4", "#2ca02c" ];
		category10 = function() { return d3.scale.ordinal().range(scale_category10); };
		var category1 = new d3.scale.category10();//category10();// new d3.scale.category10();
		var category2 = new d3.scale.category20();
		return { domain: function(val) { category1.domain(val); category2.domain(val); },
		get: function(value, threshold, precision) { if (precision >= 10) return d3.rgb(category2(value)); else return d3.rgb(category1(value)); } };
	};

})(this);
