import { el, div, View } from "/view.js";
import { test } from "./test.js";

function connect(){
	var socket = new WebSocket("ws://" + window.location.host);

	socket.addEventListener("open", () => {
		console.log("%csimple.dev.socket connected", "color: green; font-weight: bold;");
		socket.send("connection!");
	});

	socket.addEventListener("message", function(e){
		if (e.data === "reload"){
			window.location.reload();
		} else {
			console.log("message from server:", e.data);
		}
	});

	return socket;
}

connect();


const body = new View({
	el: document.body,
	capturable: false
});

View.set_captor(body);

test("test1", t => {
	div("helllllllllo?");
});

test("test2", t => {
	div.c("class-name", "content");
});

test("test3", t => {
	div.c("hi", {
		one: "one",
		two: [2, 3, 4],
		three(){
			for (var i = 0; i < 10; i++){
				div("this is an i: " + i);
			}
		},
		four: { // auto upgraded to a div, and class "four"
			five: "five",
			six: 6
		}
	});
});

test("test4", t => {
	console.log("how about nested tests?");
	test("test4_1", t => {
		console.log("this is in test 4_1");
		div("this is in 4_1");
		/*!!! The hash matching doesn't work properly, for nested tests.  test4 never runs, so test4_1 never runs... 
		 * 
		 *  I'm not sure if I ever solved this before... Mabye we just don't do nested tests, for now...
		 * 
		 *  Or, we use "/" in the hash, break it down, and make sure to match all the parts :/
		 * 
		 * Maybe just wait until I get the router going...
		 * 
		 * */
	});
});

// test("test4", t=> {
// 	test({
// 		test1(){

// 		},
// 		test2(){

// 		}
// 	});

// 	// test() creates and runs them immediately
// 	// new Test() doesn't auto run...?
// 	// could the test class be used like a module?  to transport functions around?
// });

/*
The real trick is to be able to create new tests from the browser?
I think that's a ways out, just do it with Sublime...
But, the ability to duplicate and edit (fork?) the tests means that we can experiment quickly, creating trees of experiments, and come back to them reliably...

Creating UI controls for in-code values (like Unity) is also pretty cool, powerful.

Creating test suite values (collections of strings, for example, like names, emails, etc) to rapidly bombard a fn with many values...

Reusing these test value sets (organizing into a library)...

Mapping the output of one thing to the input of another...
Any part of any fn should be savable, exportable, and importable...
*/