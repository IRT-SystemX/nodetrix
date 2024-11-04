
(function()
{
	/**
	 * Represents a Matrix (herits from View).
	 * @constructor
	 * @param {string} svg - root svg.
	 * @param {string} config - config.
	 */
	window.nodetrix.Matrix = function(rootID, width, height, config) {
		window.d3View.call(this, rootID, width, height);

		this.svg = this.svg;

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

		this.cellHandler = new window.d3Handler(this);
	};

	// Inheritance
	for (var proto in window.d3View.prototype) window.nodetrix.Matrix.prototype[proto] = window.d3View.prototype[proto];

	/** 
	 * This method binds data
	 */
	window.nodetrix.Matrix.prototype.bind = function(data, labels, ordering) {
		var _this = this;

		this.submatrix = data;
		this.labels = labels ? labels : []; if (this.labels.length === 0) data.forEach(function(d,i) { _this.labels.push(data[i][i].node.name); });
		this.ordering = {}; Object.keys(ordering).forEach(function(key) { if (!(key in _this.ordering)) _this.ordering[key] = ordering[key]; });
		if (!('none' in this.ordering)) this.ordering.none = d3.range(this.submatrix.length);

		this.update();
	};

	/**
	 * This method updates the different layers
	 */
	window.nodetrix.Matrix.prototype.update = function() {
		var _this = this;

		this.scale = d3.scale.ordinal().rangeBands([0, this.size()*this.submatrix.length]);

		if (this.config.ordering in this.ordering) _this.scale.domain(this.ordering[this.config.ordering]);
		else { console.log("ERROR: reordering "+this.config.ordering+" not found"); _this.scale.domain(this.ordering.none); }

		this.cells = [];

		this.svg.selectAll(".cell").remove(); this.svg.selectAll(".mrow").remove(); this.svg.selectAll(".column").remove();

		this.rows = this.svg.selectAll(".mrow").data(this.submatrix).enter()
			.append("g").attr("class", "mrow").attr("transform", function(d, i) { return "translate("+(1)+","+(_this.scale(i)+1)+")"; })
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

	/** 
	 * This method renders the different layers
	 */
	window.nodetrix.Matrix.prototype.render = function() {
		var _this = this;
		
		this.cells.forEach(function(cell) { cell.style("stroke", function(d) { return _this.stroke(d); }).style("stroke-width", function(d) { return _this.strokeWidth(d); }).style("fill", function(d) { return _this.fill(d); }).style("opacity", function(d) { return _this.opacity(d); }); });
	};

	/** 
	 * This method returns the size of the nodes
	 */
	window.nodetrix.Matrix.prototype.size = function(d) { return this.config.cellSize; };

	/** 
	 * This method returns the color of the nodes
	 */
	window.nodetrix.Matrix.prototype.fill = function(d) { return d.x == d.y ? this.config.cellColorDiag : d.z ?  this.config.cellColorLink : this.config.cellColor; };

	/** 
	 * This method returns the stroke of the nodes
	 */
	window.nodetrix.Matrix.prototype.stroke = function(d) { return this.config.cellStroke; };

	/** 
	 * This method returns the stroke-width of the links
	 */
	window.nodetrix.Matrix.prototype.strokeWidth = function(d) { return this.config.cellStrokeWidth; };
	/** 
	 * This method returns the stroke-width of the links
	 */
	window.nodetrix.Matrix.prototype.opacity = function(d) { return 1.0; };

	/**
	 * Represents a Matrix (herits from View).
	 * @constructor
	 * @param {string} svg - root svg.
	 * @param {string} config - config.
	 */
	window.nodetrix.SubMatrix = function(root, config) {

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
	for (proto in window.nodetrix.Matrix.prototype) window.nodetrix.SubMatrix.prototype[proto] = window.nodetrix.Matrix.prototype[proto];

}
( (window.nodetrix = window.nodetrix || {}) ));
