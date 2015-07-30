(function(nodetrix) {

	nodetrix.Context = function(callback) {
		var ready = [], loaded = [];
		var context = {
			widgets: {},
			ids: [],
			isReady: false, isLoaded: false,
			register : function(id) { this.ids.push(id); },
			waitReady : function(callback) { if (!this.isReady) ready.push(callback); else callback(); },
			waitLoaded : function(callback) { if (!this.isLoaded) loaded.push(callback); else callback(); },
			update : function(id, content) {
				this.widgets[id] = content;
				if (this.ids.length === Object.keys(this.widgets).length) {
					this.setReady();
					window.onresize = function() { for(var widget in context.widgets) if ("autoResize" in context.widgets[widget].config && ! context.widgets[widget].config.autoResize) context.widgets[widget].resize($(context.widgets[widget].id).parent().parent().width(), $(context.widgets[widget].id).parent().parent().height()); };
				}
			},
			setReady: function() { this.isReady = true; while(ready.length > 0) { var callback = ready.pop(); callback(); } },
			setLoaded: function() { this.isLoaded = true; for(var i = 0; i < loaded.length; i++) loaded[i](); },
			dispatcher: d3.dispatch("highlight", "select"),
			highlighted: [], lock: false,
			clear : function() { this.lock = true; this.highlighted.splice(0, this.highlighted.length); this.dispatcher.highlight(this.highlighted); },
			highlight : function(node) { var flag = false; if (node !== undefined) if ($.inArray(node, this.highlighted) < 0) { flag = true; this.highlighted.push(node); } else this.highlighted.splice(this.highlighted.indexOf(node), 1); this.dispatcher.highlight(this.highlighted); return flag; },
			highlighting : function(nodes) { for(var widget in context.widgets) if ('highlight' in context.widgets[widget]) context.widgets[widget].highlight(nodes); }
		};
		ready.push(callback);
		d3.rebind(context, context.dispatcher, "on");
		context.on("highlight", context.highlighting);
		context.createWidget = function(id, widget, width, height, config) {
			$.context.register(id);
			$(document).ready(function() { $.context.update(id, new widget("#"+id, width, height, config)); });
		};
		return context;
	};

	nodetrix.Handler = function(widget) {
		var handler = {
			mouseenter : function(event, widget, d) { },
			mouseover : function(event, widget, d) { },
			mouseout : function(event, widget, d) { },
			mousemove : function(event, widget, d) { },
			mouseleave : function(event, widget, d) { },
			mousedown : function(event, widget, d) { },
			mouseup : function(event, widget, d) { },
			click : function(event, widget, d) { },
			dblclick : function(event, widget, d) { },
			dragstart : function(event, widget, d) { },
			drag : function(event, widget, d) { },
			dragend : function(event, widget, d) { },
			bind : function(target) {
				target.on("mousedown", function(d) { return handler.mousedown(this, widget, d); });
				target.on("mouseup", function(d) { return handler.mouseup(this, widget, d); });
				target.on("click", function(d) { return handler.click(this, widget, d); });
				target.on("dblclick", function(d) { return handler.dblclick(this, widget, d); });
				target.on("dragstart", function(d) { return handler.dragstart(this, widget, d); });
				target.on("drag", function(d) { return handler.drag(this, widget, d); });
				target.on("dragend", function(d) { return handler.dragend(this, widget, d); });
				target.on("mouseenter", function(d) { return handler.mouseenter(this, widget, d); });
				target.on("mouseover", function(d) { return handler.mouseover(this, widget, d); });
				target.on("mouseout", function(d) { return handler.mouseout(this, widget, d); });
				target.on("mousemove", function(d) { return handler.mousemove(this, widget, d); });
				target.on("mouseleave", function(d) { return handler.mouseleave(this, widget, d); });
			}
		};
		return handler;
	};

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});

/**************************************************************/

(function(nodetrix) {
	if (!nodetrix.model) nodetrix.model = {};

	nodetrix.model.View = function(id, width, height) {
		this.id = id;
		this.width = width;
		this.height = height;

		this.zoom = d3.behavior.zoom();
	};

	nodetrix.model.View.prototype.update = function() { };

	nodetrix.model.View.prototype.render = function() { };

	nodetrix.model.View.prototype.recenter = function() { return { translate: [0.0, 0.0], scale: 1.0 }; };

	nodetrix.model.View.prototype.resize = function(width, height) { this.width = width; this.height = height; };
})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});

/**************************************************************/

(function(nodetrix) {
	if (!nodetrix.d3) nodetrix.d3 = {};

	nodetrix.d3.View = function(id, width, height) {
		nodetrix.model.View.call(this, id, width, height);

		this.svg = d3.select(id).append("svg").attr("width", this.width).attr("height", this.height);

		this.layer = this.svg.append('rect').attr('class', 'background').attr('width', "100%").attr('height', "100%");

		this.vis = this.svg.append('g');

		this.viewHandler = new nodetrix.Handler(this);
	};

	// Inheritance
	for (var proto in nodetrix.model.View.prototype) nodetrix.d3.View.prototype[proto] = nodetrix.model.View.prototype[proto];

	nodetrix.d3.View.prototype.update = function() { this.viewHandler.bind(this.svg); this.svg.attr("width", this.width).attr("height", this.height); this.viewHandler.bind(this.svg); };
})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});

/**************************************************************/

(function(nodetrix) {
	if (!nodetrix.gl) nodetrix.gl = {};

	nodetrix.gl.View = function(id, width, height) {
		nodetrix.model.View.call(this, id, width, height);

		this.renderer = new THREE.WebGLRenderer({alpha: true});
		this.renderer.setSize(width, height);
		$(id).append(this.renderer.domElement);

		this.camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 10000);
		this.camera.position.z = 1000;

		this.scene = new THREE.Scene();
		this.scene.add(this.camera);
	};

	// Inheritance
	for (var proto in nodetrix.model.View.prototype) nodetrix.gl.View.prototype[proto] = nodetrix.model.View.prototype[proto];

})
(this.nodetrix = this.nodetrix ? this.nodetrix : {});
