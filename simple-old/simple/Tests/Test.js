import TestView from "./TestView.js";
import { is } from "/simple/util.js";

export default class Test {
	constructor(...args){
		Object.assign(this, ...args);

		this.View = this.View || this.constructor.View;
	}

	run(...args){
		console.group(this.name);
		if (is.fn(this._test)){
			this._test.call(this.tests, this.tests, ...args);
		} else if (this._test.run){
			this._test.run(...args);
		}
		console.groupEnd();
	}

	render(){
		return new this.View({ test: this });
	}
	
	static use(value, ...args){
		if (is.pojo(value)){
			return new this(value, ...args);
		} else {
			return new this({ _test: value }, ...args);
		}
	}
}

Test.View = TestView;

/*

test._test == fn || test

Why?

The idea is to be able to pass either a fn or a test, to the Tests fn:

new Tests({ props and methods }).add({ test_fn(){}, imported, tests });

If the added tests can be fns or tests, or even 'tests' suite, we can use the import export system to recompose and remix these tests...
Another nice to have would be the ability to use existing test fns, but apply it to a new class or use different arguments.  That's a little harder though.

*/