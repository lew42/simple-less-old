import is from "/scripts/is.js";
import filler from "/scripts/filler.js";

export default class View {
	constructor(...args){
		this.instantiate(...args);
	}

	instantiate(...args){
		this.assign(...args);
		this.prerender();
		this.initialize();
	}

	render(){
		// optional .content
		this.content && this.append(this.content);
	}

	initialize(){
		// i think this is best
		this.render();
		// allows before and after config
	}

	prerender(){
		this.el = this.el || document.createElement(this.tag || "div");
		this.capturable && View.captor && View.captor.append(this);
		this.classify && this.classify();
	}

	classify(){
		this.addClass(this.classes);

		var cls = this.constructor;

		while (cls !== View){
			this.addClass(cls.name.replace("View", "").toLowerCase());
			cls = Object.getPrototypeOf(cls);
		}

		if (this.name)
			this.addClass(this.name);
	}

	append(...args){
		const container = (this.container && this.container.el) || this.el;

		for (const arg of args){
			if (arg && arg.el){
				arg.parent = this;
				container.appendChild(arg.el);
			} else if (is.pojo(arg)){
				this.append_pojo(arg);
			} else if (is.obj(arg)){
				this.append_obj(arg);
			} else if (is.arr(arg)){
				this.append.apply(this, arg);
			} else if (is.fn(arg)){
				this.append_fn(arg);
			} else {
				// DOM, str, undefined, null, etc
				container.append(arg);
			}
		}
		return this;
	}

	append_fn(fn){
		View.set_captor(this);
		const returnValue = fn.call(this, this);
		View.restore_captor();

		if (is.def(returnValue))
			this.append(returnValue);

		return this;
	}

	append_obj(obj){
		if (!obj.render) throw "objects must have .render method";
		this.append(obj.render());
	}

	append_pojo(pojo){
		for (const prop in pojo){
			this.append_prop(prop, pojo[prop]);
		}
		
		return this;
	}

	append_prop(prop, value){
		var view;
		if (value && value.el){
			view = value;
		} else {
			view = (new View()).append(value);
		}

		view.addClass(prop).appendTo(this);

		if (!this[prop]){
			this[prop] = view;
		} else {
			console.warn(`.${prop} property is already taken`);
		}

		return this;
	}

	appendTo(view){
		if (is.dom(view)){
			view.appendChild(this.el);
		} else {
			view.append(this);
		}
		return this;
	}
	
	addClass(...args){
		for (const arg of args){
			arg && arg.split(" ").forEach(cls => this.el.classList.add(cls));
		}
		return this;
	}

	removeClass(classes){
		classes && classes.split(" ").forEach(cls => this.el.classList.remove(cls));
		return this;
	}

	hasClass(cls){
		return this.el.classList.contains(cls);
	}

	toggleClass(cls){
		return this.hasClass(cls) ? this.removeClass(cls) : this.addClass(cls);
	}

	html(value){
		// set
		if (is.def(value)){
			this.el.innerHTML = value;
			return this;

		// get
		} else {
			return this.el.innerHTML
		}
	}

	text(value){
		// set
		if (is.def(value)){
			this.el.textContent = value;
			return this;

		// get
		} else {
			return this.el.textContent;
		}
	}

	attr(name, value){
		if (is.def(value)){
			this.el.setAttribute(name, value);
			return this;
		} else {
			return this.el.getAttribute(name);
		}
	}

	click(cb){
		if (!cb) console.error("must provide a callback");
		return this.on("click", cb);
	}

	on(event, cb){
		this.el.addEventListener(event, (...args) => {
			cb.call(this, this, ...args);
		});

		return this;
	}


	// this is more consistent with jQuery and this.el.style{}
	style(){
		return this.css(...arguments);
	}

	// inline styles
	css(prop, value){
		// set with object
		if (is.obj(prop)){
			for (var p in prop){
				this.css(p, prop[p]);
			}
			return this;

		// set with "prop", "value"
		} else if (prop && is.def(value)) {
			this.el.style[prop] = value;
			return this;

		// get with "prop"
		} else if (prop) {
			return this.el.style[prop];

		// get all
		} else if (!arguments.length){
			return this.el.style;
		} else {
			throw "whaaaat";
		}
	}

	assign(...args){
		return Object.assign(this, ...args);
	}

	static set_captor(view){
		View.previous_captors.push(View.captor);
		View.captor = view;
	}

	static restore_captor(){
		View.captor = View.previous_captors.pop();
	}

	static stylesheet(url){
		return new View({ tag: "link" }).attr("rel", "stylesheet").attr("href", url).appendTo(document.head);
	}

	static async write(...args){
		const body = new View({});
		await document.ready;
		body.el = document.body;
		body.append(...args);
	}

	static elements(){
		const View = this;
		const fns = {
			el(tag, ...args){
				return new View({ tag }).append(...args);
			},
			div(){
				return new View().append(...arguments);
			}
		};

		fns.el.c = function(tag, classes, ...args){
			return new View({ tag }).addClass(classes).append(...args);
		};

		fns.div.c = function(classes, ...args){
			return new View().addClass(classes).append(...args);
		};

		["p", "h1", "h2", "h3"].forEach(tag => {
			fns[tag] = function(){
				return new View({ tag }).append(...arguments);
			};

			fns[tag].c = function(classes, ...args){
				return new View({ tag }).addClass(classes).append(...args);
			};
		})

		return fns;
	}
}


export const { el, div, p, h1, h2, h3 } = View.elements();
export { View };

View.previous_captors = [];
View.prototype.filler = filler;
View.prototype.capturable = true;

// document.ready = new Promise((res, rej) => {
// 	if (/comp|loaded/.test(document.readyState)){
// 		res(document.body);
// 	} else {
// 		document.addEventListener("DOMContentLoaded", () => {
// 			res(document.body);
// 		});
// 	}
// });