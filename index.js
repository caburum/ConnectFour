// Server setup
const httpServer = require('http').createServer();

const express = require('express');
const app = express();

app.use(express.static('public'));

httpServer.on('request', app);

const WebSocket = require('ws');
const ws = new WebSocket.Server({ server: httpServer});

function msg(data) { // Generates a formatted JSON message
	data.timestamp = Date.now();
	return JSON.stringify(data);
}

WebSocket.prototype.broadcast = function(data, gameID = false) { // Send a message to all clients
	ws.clients.forEach((client) => {
		if (gameID == false || client.gameID == gameID) { // If a game ID is set, send to only clients playing that game
			client.send(msg(data));
		}
	});
};

// Game
const Game = require('./game.js');
var games = {};
var players = [];

// Connections
ws.on('connection', (socket, req) => {
	socket.gameID = req.url.replace('/?game=', '');

	if (!games[socket.gameID]) {
		games[socket.gameID] = new Game();
	}
	let game = games[socket.gameID];

	socket.send(msg({
		type: 'connect',
		board: game.board,
		currentPlayer: game.currentPlayer,
		winner: game.winner,
		players: players,
		game: socket.gameID
	}));

	socket.on('message', rawMessage => {
		message = JSON.parse(rawMessage);

		switch (message.type) {
			case 'ping': {
				return socket.send(msg({
					type: 'pong'
				}));
			}
			case 'dropPiece': {
				if (game.winner != 0) {
					return; // Clients were already alerted of the winner
				}
				if (message.player != game.currentPlayer) {
					return socket.send(msg({
						type: 'error',
						message: 'Not your turn'
					}));
				}
				if (!message.col) {
					return socket.send(msg({
						type: 'error',
						message: 'No column specified'
					}));
				}
				game.update(parseInt(message.col));
				return socket.broadcast({
					type: 'game',
					board: game.board,
					currentPlayer: game.currentPlayer,
					winner: game.winner
				}, socket.gameID)
			}
			case 'reset': {
				game = new Game();
				return socket.broadcast({
					type: 'reset',
					board: game.board,
					currentPlayer: game.currentPlayer,
					winner: game.winner
				}, socket.gameID)
			}
			default: {
				return socket.send(msg({
					type: 'error',
					message: 'Invalid type'
				}));
			}
		}
	});
});

ws.on('close', function close() {
	console.log('Player disconnected');
});

// Listen
httpServer.listen();