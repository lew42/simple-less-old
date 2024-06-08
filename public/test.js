import is from "/scripts/is.js";
import View, { el, div } from "../view.js";


export default class Test {
	constructor(...args){
		if (is.str(args[0])){
			this.name = args[0];
			this.fn = args[1];
		} else {
			console.error("invalid arguments");
		}

		this.container = this.container || document.body;
	}

	render(){
		this.view = div.c("test " + this.name, {
			name: div(this.name).click(this.activate.bind(this)),
			container: div()
		});

		this.should_run() && this.run();
	}

	activate(){
		window.location.hash = this.name;
		window.location.reload();
	}

	run(){
		console.group(this.name);
		Test.set_captor(this);
		View.set_captor(this.view.container);

		if (this.fn)
			this.fn();
		else 
			console.warn("no test.fn");

		Test.restore_captor();
		View.restore_captor();
		console.groupEnd();
	}

	should_run(){
		return !window.location.hash || this.match();
	}

	match(){
		return decodeURI(window.location.hash.substring(1)) === this.name;
	}

	assign(){
		return Object.assign(this, ...arguments);
	}
}

export function test(name, value){
	return new Test(name, value).render();
}

Object.assign(Test, {
	previous_captors: [],
	set_captor(test){
		this.previous_captors.push(this.captor);
		this.captor = test;
	},
	restore_captor(){
		this.captor = this.previous_captors.pop();
	},
	controls(){
		var controls = div().addClass("test-controls").append({
			reset: el("button", "reset").click(function(){
				Test.reset();
			})
		});
		document.body.appendChild(controls.el);
	},
	reset(){
		window.location.href = window.location.href.split('#')[0];
	},
	init(){
		Test.controls();
		const body = new View({ el: document.body });
		View.set_captor(body);
	}
});

Test.init();