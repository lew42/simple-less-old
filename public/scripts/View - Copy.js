import is from "./is.js";
import filler from "./filler.js";

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

	removable(event, cb){
		const wrapper = (...args) => {
			cb.call(this, this, ...args);
		};

		this.el.addEventListener(event, wrapper);

		return () => {
			this.el.removeEventlistener(event, wrapper);
		};
	}

	emit(event, detail){
		const e = new CustomEvent(event, { detail });
		this.el.dispatchEvent(e);
		return this;
	}

	empty(){
		this.el.innerHTML = "";
		return this;
	}

	focus(){
		this.el.focus();
		return this;
	}

	show(){
		this.el.style.display = "";
		return this;
	}

	styles(){
		return getComputedStyle(this.el);
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

	toggle(){
		if (this.styles().display === "none")
			return this.show();
		else {
			return this.hide();
		}
	}

	index(){
		var index = 0, prev;
		// while (prev = this.el.previousElementSibling)
	}

	reset(...args){
		this.empty();
		this.append(...args);
		return this;
	}

	hide(){
		this.el.style.display = "none";
		return this;
	}

	remove(){
		this.el.parentNode && this.el.parentNode.removeChild(this.el);
		return this;
	}

	editable(remove){
		remove = (remove === false);
		const hasAttr = this.el.hasAttribute("contenteditable");

		if (remove && hasAttr){
			// console.warn(this.el, "remove ce");
			this.el.removeAttribute("contenteditable");
		} else if (!remove && !hasAttr) {
			// console.warn(this.el, "add ce");
			this.attr("contenteditable", true)
		}
		return this;
	}

	value(){
		// get&set?
		return this.el.innerHTML;
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

	static make(props){
		for (const prop of props){
			this.use(props[prop], { name: prop });
		}
	}

	static fake(n){
		for (var i = 0; i < n; i++){
			// make a dummy with filler...
		}
	}

	/*
	To append an obj:

	View.make({
		name(){ return {
			props: "here"
		}},
		name: {
			other: config,
			content: {
				props: "here"
			}
		},
		name: div({
			props: "here" // probably the easiest
		})
	})
	*/
	static use(value, ...args){
		if (value instanceof View){
			return new this({ el: value.el }, ...args);
		} else if (is.pojo(value)) {
			return new this(value, ...args);
		} else {
			return new this({ content: value }, ...args);
		}
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

// View.elements = {
// 	el(tag, ...args){
// 		return new View({ tag }).append(...args);
// 	},
// 	div(){
// 		return new View().append(...arguments);
// 	}
// };

// View.elements.el.c = function(tag, classes, ...args){
// 	return new View({ tag }).addClass(classes).append(...args);
// }

// View.elements.div.c = function(classes, ...args){
// 	return new View().addClass(classes).append(...args);
// }

// View.classy = {
// 	el(tag, classes, ...args){
// 		return new View({ tag }).addClass(classes).append(...args);
// 	},
// 	div(classes, ...args){
// 		return new View().addClass(classes).append(...args);
// 	}
// };

// View.smarty = {
// 	el(token, ...args){},
// 	div(token, ...args){
// 		if (token[0] === "."){
// 			return new View().addClass(token.slice(1)).append(...args);
// 		} else {
// 			return new View().append(...arguments); // append all args
// 		}
// 	}
// };

/*
div("hello world")
div(".hello", "world")
div(".hell.o", "world")
div(".hell o", "world")

if it's not part of the append_obj system, you could grab the first class as a property, and auto-reference...

content(){
	div(".one", "one"); // appends to parent, but also assigns to prop .one?
}
*/

// ["p", "h1", "h2", "h3"].forEach(tag => {
// 	View.elements[tag] = function(){
// 		return new View({ tag }).append(...arguments);
// 	};

// 	View.elements[tag].c = function(classes, ...args){
// 		return new View({ tag }).addClass(classes).append(...args);
// 	}

// 	View.classy[tag] = function(classes, ...args){
// 		return new View({ tag }).addClass(classes).append(...args);
// 	};
// })

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