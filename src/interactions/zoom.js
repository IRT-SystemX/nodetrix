(function(nodetrix) {
	if (!nodetrix.d3) nodetrix.d3 = {};
	if (!nodetrix.d3.interaction) nodetrix.d3.interaction = {};

	// Constructor
	nodetrix.d3.interaction.Zoom = function(widget) {
		var _this = this;
		this.widget = widget;

		this.zooming = function() { _this.widget.vis.attr("transform", "translate(" + _this.widget.zoom.translate() + ") scale(" + _this.widget.zoom.scale() + ")"); };
		this.centering = function() { var correction = _this.widget.recenter(); _this.widget.zoom.translate(correction.translate).scale(correction.scale); _this.zooming(); };
		this.widget.layer.call( this.widget.zoom.on("zoom", this.zooming) );

		this.mousedownZoom = this.widget.layer.on("mousedown.zoom");
		this.mousemoveZoom = this.widget.layer.on("mousemove.zoom");
		this.touchstartZoom = this.widget.layer.on("touchstart.zoom");
		this.widget.layer.on("mousedown.zoom", null);
		this.widget.layer.on("mousemove.zoom", null);
		this.widget.layer.on("touchstart.zoom", null);

		this.widget.layer.on("dblclick.zoom", this.centering);
	};

	// Data binding
	nodetrix.d3.interaction.Zoom.prototype.bind = function() {
		this.widget.layer.on("mousedown.zoom", this.mousedownZoom);
		this.widget.layer.on("mousemove.zoom", this.mousemoveZoom);
		this.widget.layer.on("touchstart.zoom", this.touchstartZoom); var _this = this;
	};

	nodetrix.d3.interaction.Zoom.prototype.unbind = function() {
		this.widget.layer.on("mousedown.zoom", null);
		this.widget.layer.on("mousemove.zoom", null);
		this.widget.layer.on("touchstart.zoom", null);
		//this.widget.layer.on("dblclick.zoom", null);
	};

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});

/**************************************************************/

(function(nodetrix) {
	if (!nodetrix.gl) nodetrix.gl = {};
	if (!nodetrix.gl.interaction) nodetrix.gl.interaction = {};

	// Constructor
	nodetrix.gl.interaction.Zoom = function(widget) {
		var _this = this;
		this.widget = widget;

		this.zooming = function() {
			_this.widget.camera.position.x = _this.widget.zoom.translate()[0]; //(_this.widget.zoom.translate()[0]/_this.widget.width)*2.0 - 1;
			_this.widget.camera.position.y = _this.widget.zoom.translate()[1];//-(_this.widget.zoom.translate()[1] / _this.widget.height)*2.0 + 1;
			_this.widget.camera.zoom = _this.widget.zoom.scale(); // < 1 ? _this.widget.zoom.scale() : 1;
			_this.widget.camera.updateProjectionMatrix();
			console.log(_this.widget.camera.position)
		};
		this.centering = function() { var correction = _this.widget.recenter(); _this.widget.zoom.translate(correction.translate).scale(correction.scale); _this.zooming();	};
		this.widget.layer.call( this.widget.zoom.on("zoom", this.zooming) );

		this.mousedownZoom = this.widget.layer.on("mousedown.zoom");
		this.mousemoveZoom = this.widget.layer.on("mousemove.zoom");
		this.touchstartZoom = this.widget.layer.on("touchstart.zoom");

		this.widget.layer.on("mousedown.zoom", null);
		this.widget.layer.on("mousemove.zoom", null);
		this.widget.layer.on("touchstart.zoom", null);

		this.widget.layer.on("dblclick.zoom", this.centering);
	};

	// Data binding
	nodetrix.gl.interaction.Zoom.prototype.bind = function() {
		this.widget.layer.on("mousedown.zoom", this.mousedownZoom);
		this.widget.layer.on("mousemove.zoom", this.mousemoveZoom);
		this.widget.layer.on("touchstart.zoom", this.touchstartZoom); var _this = this;
	};

	nodetrix.gl.interaction.Zoom.prototype.unbind = function() {
		this.widget.layer.on("mousedown.zoom", null);
		this.widget.layer.on("mousemove.zoom", null);
		this.widget.layer.on("touchstart.zoom", null);
		//this.widget.layer.on("dblclick.zoom", null);
	};

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});
