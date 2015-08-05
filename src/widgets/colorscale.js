(function(nodetrix) {
	if (!nodetrix.d3) nodetrix.d3 = {};

	// Constructor
	nodetrix.d3.Legend = function(id, width, height, config) {
		nodetrix.d3.View.call(this, id, width, height);

		// default visual properties
		this.config = {
			nodeSize: 'nodesize' in config ? config.nodesize : 15,
			nodeStrokeWidth: 'nodestrokewidth' in config ? config.nodestrokewidth : 1,
			colorscale: 'colorscale' in config ? config.colorscale : new nodetrix.model.Colorscale.Category(),
			allowHighlight: 'allowHighlight' in config ? config.allowHighlight : true
		};

		// data model
		this.groups = [];
		this.index = [];
		this.reversed = {};
		this.selectedGroup = [];

		// visual layers
		//this.layer.style("stroke", "gray").style("stroke-width", 1);
		this.groupLayer = this.vis.append("g");
		this.labelLayer = this.vis.append("g");
		this.group = this.groupLayer.selectAll(".group");
		this.label = this.labelLayer.selectAll(".label");

		this.groupHandler = new nodetrix.Handler(this);

		// colorscale properties
		this.precision = 10.0;
		//this.bbox = this.vis.append("svg:text").attr("dy", ".35em").attr("text-anchor", "middle").style("font-size", "12px").style("visibility", "hidden").text("testSize1000").node().getBBox();
	};

	// Inheritance
	for (var proto in nodetrix.d3.View.prototype) nodetrix.d3.Legend.prototype[proto] = nodetrix.d3.View.prototype[proto];

	// Data binding
	nodetrix.d3.Legend.prototype.bind = function(data) {
		this.groups.splice(0, this.groups.length);
		this.index = []; this.selectedGroup = [];
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
				color: function() { return _this.coloring(group); }
			};
			_this.groups.push(visualGroup);
			_this.index.push(group);
			data[group].forEach(function(node, i) { _this.reversed[node.name] = visualGroup; });
		});

		this.update();
	};

	// Update
	nodetrix.d3.Legend.prototype.update = function() {
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

	// Render
	nodetrix.d3.Legend.prototype.render = function() {

		this.group.attr("transform", function(d, i) { return !isNaN(d.x) && !isNaN(d.y) ? "translate("+(d.x-d.size()/2.0)+","+(d.y-d.size()/2.0)+")" : "translate(0,0)"; })
			.attr("width", function(d) { return d.size(); }).attr("height", function (d) { return d.size(); }).attr("rx", 0).attr("ry", 0)
			.style("fill", function(d) { return d.color(); }).style("stroke", function(d) { return "black"; }).style("stroke-width", function(d) { return d.strokeWidth(); });

		this.label.attr("x", function(d) { return d.x+d.size(); }).attr("y", function(d) { return d.y; }).attr("dy", ".32em").attr("text-anchor", "left").style("fill", "gray")
		.text(function(d, i) { return d.label; }); //return "cluster n°"+(i+1); });

	};


	// Extra methods
	nodetrix.d3.Legend.prototype.highlight = function(nodes) {
		var _this = this;

		this.groups.forEach(function(d) { d.isHighlighted = false; });
		this.selectedGroup.splice(0, this.selectedGroup.length);

		if (nodes && Object.keys(_this.reversed).length > 0) nodes.forEach(function(d) { var group = _this.reversed[d.name]; group.isHighlighted = true; if ($.inArray(group, _this.selectedGroup) < 0) _this.selectedGroup.push(group); });

		this.render();
	};

	nodetrix.d3.Legend.prototype.nodeSize = function(d) { return this.config.nodeSize; };

	nodetrix.d3.Legend.prototype.nodeStrokeWidth = function(d) { return d.isHighlighted ? this.config.nodeStrokeWidth * 3 : this.config.nodeStrokeWidth; };

	nodetrix.d3.Legend.prototype.coloring = function(id) { return this.config.colorscale ? this.config.colorscale.get(this.index.indexOf(""+id)) : d3.rgb("white"); };

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});

/**************************************************************/

(function(nodetrix) {
	if (!nodetrix.d3) nodetrix.d3 = {};

	// Constructor
	nodetrix.d3.Colorscale = function(id, width, height, config) {
		nodetrix.d3.View.call(this, id, width, height);

		// default visual properties
		this.config = {
			nodeSize: 'nodesize' in config ? config.nodesize : 1,
			colorscale: 'colorscale' in config ? config.colorscale : new nodetrix.model.Colorscale.Gray(0, 220)
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

		this.groupHandler = new nodetrix.Handler(this);

		// colorscale properties
		this.precision = 10.0;
	};

	// Inheritance
	for (var proto in nodetrix.d3.View.prototype) nodetrix.d3.Colorscale.prototype[proto] = nodetrix.d3.View.prototype[proto];

	// Data binding
	nodetrix.d3.Colorscale.prototype.bind = function(data) {
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

	// Update
	nodetrix.d3.Colorscale.prototype.update = function() {
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

	// Render
	nodetrix.d3.Colorscale.prototype.render = function() {

		this.group.attr("transform", function(d, i) { return !isNaN(d.x) && !isNaN(d.y) ? "translate("+(d.x-d.size()/2.0)+","+(d.y-d.size()/2.0)+")" : "translate(0,0)"; })
			.attr("width", function(d) { return d.size(); }).attr("height", function (d) { return d.size(); }).attr("rx", 0).attr("ry", 0)
			.style("fill", function(d) { return d.color(); }).style("stroke", function(d) { return "black"; }).style("stroke-width", function(d) { return d.strokeWidth(); });

		this.label.attr("x", function(d) { return d.x+d.size(); }).attr("y", function(d) { return d.y; }).attr("dy", ".32em").attr("text-anchor", "left").style("fill", "gray")
		.text(function(d, i) { return d.label; }); //return "cluster n°"+(i+1); });

	};


	// Extra methods
	nodetrix.d3.Colorscale.prototype.coloring = function(val) { return this.config.colorscale ? this.config.colorscale.get(1-val) : d3.rgb("white"); };

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});

/**************************************************************/

(function(nodetrix) {
	if (!nodetrix.model) nodetrix.model = {};
	if (!nodetrix.model.Colorscale) nodetrix.model.Colorscale = {};

	nodetrix.model.Colorscale.Hue = function(hueMin, hueMax) {
		return { get: function(value, threshold, precision) { return d3.hsl( (hueMin + (hueMax -hueMin) * (1 - value)) % 360, 1.0, 0.5 ).rgb(); } };
	};

	nodetrix.model.Colorscale.Gray = function() {
		return {
			get: function(value) {
				value = value; //*0.7;
				var x = 0.299 * value * 255 + 0.587 * value * 255 + 0.114 * value * 255;
				return d3.rgb(x, x, x);
			}
		};
	};

	nodetrix.model.Colorscale.Category = function(hue) {
		 /* var category20 = [ "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#bcbd22", "#dbdb8d","#ff9896", "#d62728"
		"#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#17becf", "#9edae5" ];
		var ddd_category10 = [ ff7f0e",	"#7f7f7f", "#bcbd22", "#17becf", "#e377c2", "#d62728", "#9467bd", "#8c564b", "#1f77b4", "#2ca02c"	]; */
		var scale_category10 = [ "orange", "green", "#9467bd","blue", "red", "yellow", "#8c564b", "#1f77b4", "#2ca02c" ];
		category10 = function() { return d3.scale.ordinal().range(scale_category10); };
		var category1 = new d3.scale.category10();
		var category2 = new d3.scale.category20();
		return { domain: function(val) { category1.domain(val); category2.domain(val); },
		get: function(value, threshold, precision) { if (precision >= 10) return d3.rgb(category2(value)); else return d3.rgb(category1(value)); } };
	};

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});
