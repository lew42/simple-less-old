const express = require("express");
const chokidar = require("chokidar");
const WebSocket = require("ws");
const http = require("http");
const app = express();

const site = "public";

app.use(express.static(__dirname + "/" + site));

const server = http.createServer(app);
const wss = new WebSocket.Server({
	perMessageDeflate: false,
	server: server
});

var connection_count = 0;

wss.on("connection", function(ws){
	console.log("connected", ++connection_count);

	chokidar.watch("./" + site).on("change", (e) => {
		console.log(e, "changed, sending reload message");
		ws.send("reload", (err) => {
			if (err) console.log("livereload transmit error");
			else console.log("reload message sent");
		});
	});
});

server.listen(80, function(){
	console.log("Listening..");
});