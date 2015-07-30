(function(nodetrix) {
	if (!nodetrix.model) nodetrix.model = {};

	// Constructor
	nodetrix.model.Matrix = function(id, width, height, config) {
		nodetrix.model.View.call(this, id, width, height);

		this.config = {
			cellSize: config && 'cellsize' in config ? config.cellsize : 10,
			cellColor: config && 'cellcolor' in config ? config.cellcolor : "#FFFFFF",
			cellColorLink: config && 'cellcolorlink' in config ? config.cellcolorlink : "#000000",
			cellColorDiag: config && 'cellcolordiag' in config ? config.cellcolordiag : "#D3D3D3",
			cellStroke: config && 'cellstroke' in config ? config.cellstroke : "#D3D3D3",
			cellStrokeWidth: config && 'cellstrokewidth' in config ? config.cellstrokewidth : 1,
			ordering: config && 'ordering' in config ? config.ordering : 'none',
			allowLabels: config && 'allowlabels' in config ? config.allowlabels : false
		};

		this.cellHandler = new nodetrix.Handler(this);
	};

	// Inheritance
	for (var proto in nodetrix.model.View.prototype) nodetrix.model.Matrix.prototype[proto] = nodetrix.model.View.prototype[proto];

	// Data binding
	nodetrix.model.Matrix.prototype.bind = function(data, labels, ordering) {
		var _this = this;

		this.submatrix = data;
		this.labels = labels ? labels : []; if (this.labels.length === 0) data.forEach(function(d,i) { _this.labels.push(data[i][i].node.name); });
		this.ordering = {}; Object.keys(ordering).forEach(function(key) { if (!(key in _this.ordering)) _this.ordering[key] = ordering[key]; });
		if (!('none' in this.ordering)) this.ordering.none = d3.range(this.submatrix.length);

		this.update();
	};

	// Update
	nodetrix.model.Matrix.prototype.update = function() {

		this.scale = d3.scale.ordinal().rangeBands([0, this.size()*this.submatrix.length]);

		if (this.config.ordering in this.ordering) this.scale.domain(this.ordering[this.config.ordering]);
		else { console.log("ERROR: reordering "+this.config.ordering+" not found"); this.scale.domain(this.ordering.none); }

		this.cells = [];

		nodetrix.model.View.prototype.update.call(this);
	};

	// Render
	nodetrix.model.Matrix.prototype.render = function() {

		nodetrix.model.View.prototype.render.call(this);
	};


	// Extra methods
	nodetrix.model.Matrix.prototype.size = function(d) { return this.config.cellSize; };

	nodetrix.model.Matrix.prototype.fill = function(d) { return d.x == d.y ? this.config.cellColorDiag : d.z ?  this.config.cellColorLink : this.config.cellColor; };

	nodetrix.model.Matrix.prototype.stroke = function(d) { return this.config.cellStroke; };

	nodetrix.model.Matrix.prototype.strokeWidth = function(d) { return this.config.cellStrokeWidth; };

	nodetrix.model.Matrix.prototype.opacity = function(d) { return 1.0; };
})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});

/**************************************************************/

(function(nodetrix) {
	if (!nodetrix.d3) nodetrix.d3 = {};

	// Constructor
	nodetrix.d3.Matrix = function(id, width, height, config) {
			nodetrix.d3.View.call(this, id, width, height);
			nodetrix.model.Matrix.call(this, id, width, height, config);

			// visual layers
			this.edgesLayer = this.vis.append("g");
			this.nodesLayer = this.vis.append("g");
			this.node = this.nodesLayer.selectAll(".node");
			this.link = this.edgesLayer.selectAll(".link");
	};

	// Inheritance
	for (var proto in nodetrix.model.Matrix.prototype) nodetrix.d3.Matrix.prototype[proto] = nodetrix.model.Matrix.prototype[proto];

	// Resize
	nodetrix.d3.Matrix.prototype.resize = function(width, height) {
			nodetrix.d3.View.prototype.resize.call(this);

	};

	// Update
	nodetrix.d3.Matrix.prototype.update = function(width, height) {

			var _this = this;

			nodetrix.model.Matrix.prototype.update.call(this);

			this.svg.selectAll(".cell").remove(); this.svg.selectAll(".row").remove(); this.svg.selectAll(".column").remove();

			this.rows = this.svg.selectAll(".row").data(this.submatrix).enter()
				.append("g").attr("class", "row").attr("transform", function(d, i) { return "translate("+(1)+","+(_this.scale(i)+1)+")"; })
					.each(function(row) {
						_this.cells.push( d3.select(this).selectAll(".cell").data(row)
							.enter().append("rect").attr("class", "cell")
							.attr("x", function(d) { return (_this.scale(d.x)); }).attr("width", _this.scale.rangeBand()).attr("height", _this.scale.rangeBand())
						);
					});

			if (this.config.allowLabels) {
				this.svg.selectAll('.cell-label').remove();
				this.cellLabels = this.svg.selectAll(".cell-label").data(this.labels).enter().append('g').attr("class", "cell-label");
				var mx = 0;
				this.cellLabels.append("text")
					.text(function(d, i) { return d; })
					.attr("text-anchor", "end")
					.attr("dy", function (d,i) { mx = mx < this.getBBox().width ? this.getBBox().width : mx; return _this.scale(i)+_this.scale.rangeBand()+1.0/2.0*(_this.scale.rangeBand()-this.getBBox().height); })
					.attr("dx", function (d) { return -_this.scale.rangeBand()/2.0; })
					//.attr("width", function(d) { return mx; }).attr("height", function (d) { return this.getBBox().height; })
					.style("stroke", function(d) { return "white"; }).style("stroke-width", 0)
					.style("font-size", function(d) { return 8; });
			}

			/*		labels.insert("rect", ":first-child")
				.attr("transform", function(d) { return "translate("+(-this.getBBox().width - scale.rangeBand()/2.0)+","+(2)+")"; })
				.attr("width", function(d) { return this.getBBox().width+2; }).attr("height", function (d) { return this.getBBox().height; })
				.style("fill", function(d) { return "red"; })
				.style("stroke", function(d) { return "white"; }).style("stroke-width", function(d) { return 0; }); */

			this.cells.forEach(function(cell) { _this.cellHandler.bind(cell); });
			//if (this.config.allowLabels) this.cellLabels.forEach(function(cell) { _this.cellHandler.bind(cell); });

			this.svg.selectAll(".column").data(this.submatrix).enter().append("g").attr("class", "column").attr("transform", function(d, i) { return "translate("+(_this.scale(i))+","+(0)+")rotate(-90)"; });

			this.render();
	};

	// Render
	nodetrix.d3.Matrix.prototype.render = function(width, height) {
			var _this = this;

			this.cells.forEach(function(cell) { cell.style("stroke", function(d) { return _this.stroke(d); }).style("stroke-width", function(d) { return _this.strokeWidth(d); }).style("fill", function(d) { return _this.fill(d); }).style("opacity", function(d) { return _this.opacity(d); }); });

			nodetrix.model.Matrix.prototype.render.call(this);
	};


	// Node matrix
	nodetrix.d3.Matrix.SubMatrix = function(root, config) {

		this.svg = root;

		this.config = {
			cellSize: config && 'cellsize' in config ? config.cellsize : 10,
			cellColor: config && 'cellcolor' in config ? config.cellcolor : "#FFFFFF",
			cellColorLink: config && 'cellcolorlink' in config ? config.cellcolorlink : "#000000",
			cellColorDiag: config && 'cellcolordiag' in config ? config.cellcolordiag : "#0000FF",
			cellStroke: config && 'cellstroke' in config ? config.cellstroke : "#0000FF",
			cellStrokeWidth: config && 'cellstrokewidth' in config ? config.cellstrokewidth : 1,
			ordering: config && 'ordering' in config ? config.ordering : 'none',
			allowLabels: config && 'allowlabels' in config ? config.allowlabels : false
		};
	};

	// Inheritance
	for (proto in nodetrix.d3.Matrix.prototype) nodetrix.d3.Matrix.SubMatrix.prototype[proto] = nodetrix.d3.Matrix.prototype[proto];

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});

/**************************************************************/

(function(nodetrix) {
	if (!nodetrix.gl) nodetrix.gl = {};

	// Constructor
	nodetrix.gl.Matrix = function(id, width, height, config) {
		nodetrix.gl.View.call(this, id, width, height);
		nodetrix.model.Matrix.call(this, id, width, height, config);

	};

	// Inheritance
	for (var proto in nodetrix.model.Matrix.prototype) nodetrix.gl.Matrix.prototype[proto] = nodetrix.model.Matrix.prototype[proto];

	// Update
	nodetrix.gl.Matrix.prototype.update = function(width, height) {

			nodetrix.model.Matrix.prototype.update.call(this);
	};

	// Render
	nodetrix.gl.Matrix.prototype.render = function(width, height) {

			nodetrix.model.Matrix.prototype.render.call(this);
	};

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});
