
(function()
{
	/**
	 * Represents a Pan and Zoom interaction.
	 * @constructor
	 * @param {string} root - root div.
	 */
	window.interaction.Lasso = function(widget, layerName, callback, config) {

		// default visual properties
		this.config = {
			threshold: 'threshold' in config ? config.threshold : 10,
			stroke: 'stroke' in config ? config.stroke : "gray", //"#0000FF",
			strokeWidth: 'strokeWidth' in config ? config.strokewidth : 1
		};

		// data model
		this.widget = widget;
		this.callback = callback;
		this.points = [];
		this.isMouseDown = false;
		this.lineFunction = d3.svg.line().x(function(d) { return d.x; }).y(function(d) { return d.y; }).interpolate("basis-closed");

		// visual layers
		this.lasso = widget[layerName].selectAll(".lasso");
	};

	/**
	 * This method renders the different layers
	 */
	window.interaction.Lasso.prototype.update = function() {
		var _this = this;
		this.lasso.remove();
		this.lasso = this.lasso.data(this.points);
		this.lasso.enter().append("svg:path").attr("class", "lasso");
		this.lasso.attr("d", this.lineFunction(this.points)).style("fill", "none").style("stroke", function(d) { return _this.stroke(); }).style("stroke-width", function(d) { return _this.strokeWidth(); });
	};

	/**
	 * This method updates the different layers
	 */
	window.interaction.Lasso.prototype.bind = function(keyBinding) {
		var _this = this;

		if (keyBinding) key(keyBinding, function() { $(event).css('cursor', 'crosshair'); });

		this.widget.viewHandler.mousedown = function(event, widget, d) {
			if (!keyBinding || key.isPressed(keyBinding)) { _this.isMouseDown = true; }
		};

		this.widget.viewHandler.mousemove = function(event, widget, d) {
			if (!keyBinding || key.isPressed(keyBinding)) {
				$(event).css('cursor', 'crosshair');
				var pos = { x: (d3.mouse(event)[0] - _this.widget.zoom.translate()[0]) / _this.widget.zoom.scale(), y: (d3.mouse(event)[1] - _this.widget.zoom.translate()[1]) / _this.widget.zoom.scale() };
				if (_this.isMouseDown) {
					if (_this.points.length > 0) {
						var last = _this.points[_this.points.length-1];
						var dx = pos.x - last.x , dy = pos.y - last.y, dist = dx*dx+dy*dy;
						if (dist >= _this.config.threshold*_this.config.threshold) { _this.points.push(pos); _this.update(); }
					}
					else _this.points.push(pos);
				}
			} else $(event).css('cursor', 'auto');
		};

		this.widget.viewHandler.mouseup = function(event, widget, d) {
			if (_this.isMouseDown) {
				_this.isMouseDown = false;
				$(event).css('cursor', 'auto');
				_this.update();

				var cluster = [];
				_this.widget.visualgraph.nodes.forEach(function(point) {
					var contains = false;
					for (var i = 0; i < _this.points.length; i++) {
						var j = i < _this.points.length-1 ? i + 1 : 0;
						var x = point.x , y = point.y ;
						if ( (_this.points[i].y > y) != (_this.points[j].y > y) && (x < (_this.points[j].x - _this.points[i].x) * (y - _this.points[i].y) / (_this.points[j].y - _this.points[i].y) + _this.points[i].x) ) { contains = !contains; }
					}
					if (contains) { point.fixed = true; cluster.push(point.id); }
				});

				//cluster.sort(function(a, b) { return a - b; });
				_this.callback(cluster);

				_this.points.splice(0, _this.points.length);

				//widget.node.filter(function(d) { return d.fixed; }).style("fill", "red");
			}
		};
	};

	/**
	 * This method updates the different layers
	 */
	window.interaction.Lasso.prototype.unbind = function() {
		this.widget.viewHandler.mousedown = null;
		this.widget.viewHandler.mousemove = null;
		this.widget.viewHandler.mouseup = null;
	};

	/**
	 * This method returns the stroke of the links
	 */
	window.interaction.Lasso.prototype.stroke = function(d) { return this.config.stroke; };

	/**
	 * This method returns the stroke-width of the links
	 */
	window.interaction.Lasso.prototype.strokeWidth = function(d) { return this.config.strokeWidth; };

}
( (window.interaction = window.interaction || {}) ));
