(function(nodetrix) {
	if (!nodetrix.d3) nodetrix.d3 = {};
	if (!nodetrix.d3.interaction) nodetrix.d3.interaction = {};

	// Constructor
	nodetrix.d3.interaction.Brush = function(widget) { this.widget = widget; };

	// Data binding
	nodetrix.d3.interaction.Brush.prototype.bind = function(keyBinding) {
		var _this = this;

		var brush = this.widget.svg.append("g").attr("class", "brush");
		var brushing = d3.svg.brush().x(d3.scale.identity().domain([0, this.widget.width])).y(d3.scale.identity().domain([0, this.widget.height]));

		var items = [];
		var labelsLayer = this.widget.svg.append("g"), arrowsLayer = this.widget.svg.append("g");

		this.brushCallback = brushing.on("brush", function() {
			var extent = d3.event.target.extent();

			_this.widget.d3cola.stop();

			_this.widget.visualgraph.nodes.forEach(function(d) {
				if (extent[0][0] <= d.x && d.x < extent[1][0] && extent[0][1] <= d.y && d.y < extent[1][1]) { d.isHighlighted = true; if ($.inArray(d, items) < 0) items.push(d); }
				else { d.isHighlighted = false; if ($.inArray(d, items) >= 0) items.splice(items.indexOf(d), 1); }
			});

			var extentWidth = (extent[1][0] - extent[0][0]), extentHeight = (extent[1][1] - extent[0][1]), countLeft = 0, countRight = 0;
			var getPosition = function(d,i) {
				var x = d.isLeft ? extent[0][0]-d.bbox.width : extent[1][0];
				var y = d.isLeft ? extent[0][1]+countLeft*d.bbox.height : extent[0][1]+countRight*d.bbox.height;
				if (d.isLeft) countLeft++; else countRight++;
				return [ d.isLeft ? x - 10 : x + 10 , y ];
			};

			items.forEach(function(d) { d.isLeft = (d.x-extent[0][0]) > extentWidth/2.0 ? false : true; });

			// todo: fix crossing prb
			items = items.sort(function(a,b) { return a.isLeft == b.isLeft ? (b.y - a.y) >= 0 ? -1 : 1 : a.isLeft ? 1 : -1; });

			labelsLayer.selectAll('.labels').remove(); arrowsLayer.selectAll('.arrows').remove();

			var labels = labelsLayer.selectAll(".labels").data(items, function(d) { return d.id; });
			labels.enter().append('g').attr("class", "labels");
			labels.exit().remove();

			labels.append("text")
				.attr("text-anchor", "left").style("font-size", "10px").text(function(d, i) { return d.raw.name; })
				.attr("dy", function (d,i) { d.bbox = this.getBBox(); d.labelPos = getPosition(d,i); return d.bbox.height*0.9; })
				.style("fill", function(d) { return "black"; }).style("stroke", function(d) { return 'gray'; }).style("stroke-width", 0);
			labels.insert("rect", ":first-child")
				.attr("transform", function(d,i) { return "translate("+(d.isLeft ? 0 : -10)+",0)"; })
				.attr("width", function(d) { return d.bbox.width+10; }).attr("height", function (d) { return d.bbox.height; })
				.style("fill", function(d) { return "white"; }).style("stroke", function(d) { return d.stroke(); }).style("stroke-width", function(d) { return 0; });

			var arrows = arrowsLayer.selectAll(".arrows").data(items, function(d) { return d.id; });
			arrows.enter().append('g').attr("class", "arrows");
			arrows.exit().remove();
			arrows.insert("line", ":last-child")
				.attr("x1", function (d) { return d.isLeft ? d.bbox.width + 5 : -5 ; }).attr("y1", function (d) { return d.bbox.height/2; })
				.attr("x2", function (d) { return d.x-d.labelPos[0]; }).attr("y2", function (d) { return d.y-d.labelPos[1]; })
				.style("stroke", function(d) { return 'black'; }).style("stroke-width", 2);

			labels.attr("transform", function(d,i) { return "translate("+d.labelPos[0]+","+d.labelPos[1]+")"; });
			arrows.attr("transform", function(d,i) { return "translate("+d.labelPos[0]+","+d.labelPos[1]+")"; });

			_this.widget.render();
		});

		brush.call(this.brushCallback);
	};

	nodetrix.d3.interaction.Brush.prototype.unbind = function() {
		/*
		event[type].remove(listener);
		d3_behavior_zoomPanning = null;
		d3_behavior_zoomStopClick = false;
		window.removeEventListener("mousemove", window["__onmousemove.zoom"], false);
		window.removeEventListener("mousemove", window["__onmousemove.zoom"], true);
		*/
	};

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});
