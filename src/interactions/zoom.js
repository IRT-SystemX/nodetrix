
(function()
{
	/**
	 * Represents a Pan and Zoom interaction.
	 * @constructor
	 * @param {string} root - root div.
	 */
	window.interaction.Zoom = function(widget) {

		this.widget = widget;

		var _this = this;
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

	/**
	 * This method updates the different layers
	 */
	window.interaction.Zoom.prototype.bind = function() {
		this.widget.layer.on("mousedown.zoom", this.mousedownZoom);
		this.widget.layer.on("mousemove.zoom", this.mousemoveZoom); 
		this.widget.layer.on("touchstart.zoom", this.touchstartZoom); var _this = this;
	};

	/**
	 * This method updates the different layers
	 */
	window.interaction.Zoom.prototype.unbind = function() {
		this.widget.layer.on("mousedown.zoom", null); 
		this.widget.layer.on("mousemove.zoom", null); 
		this.widget.layer.on("touchstart.zoom", null); 
		//this.widget.layer.on("dblclick.zoom", null);
	};

}
( (window.interaction = window.interaction || {}) ));
