// Game ID
var queryParams = new URLSearchParams(window.location.search);
if (!queryParams.get('game')) { // Generate random game ID if needed
	queryParams.set('game', Math.floor(Math.random() * 0xFFFFFF).toString(16));
  history.replaceState(null, null, '?' + queryParams.toString());
}
const gameID = queryParams.get('game');

// Connect
const socket = new WebSocket('wss://' + location.hostname + (location.port ? ':' + location.port : '') + '/?game=' + gameID);

// Game data
var board = [],
oldBoard = [
	[0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0]
];

window.player = 1; // @todo: track which player is which

// Message handler
socket.onmessage = function handleMessage(rawMessage) {
	console.log('RX:', rawMessage.data);
	message = JSON.parse(rawMessage.data);

	switch (message.type) {
		case 'pong': {
			return console.info('pong');
		}
		case 'connect': {
			board = message.board;
			parseWinner(message.winner);
			return parseBoard(board, oldBoard);
		}
		case 'game': {
			oldBoard = board; // Save previous board
			board = message.board;
			parseBoard(board, oldBoard);
			if (message.winner == 0) {
				return;
			} else {
				return parseWinner(message.winner);
			}
		}
		case 'reset': {
			$('.p1, .p2').remove();
			board = message.board;
			return parseBoard(board, oldBoard);
		}
		case 'error': {
			console.error(message.message);
		}
	}
};

$('button#send').on('click', function(e) {
	socket.send(JSON.stringify({
		type: 'ping'
	}));
});

// Drops a piece
$('div#droppers > div').click(function() {
	let id = $(this).attr('id').replace(/\D/g, '');
	dropPiece(id);
});

function dropPiece(col) {
	// @todo: disable buttons when not the player's turn
	console.log('Dropping in column', col);
	socket.send(JSON.stringify({
		type: 'dropPiece',
		player: window.player,
		col: col
	}));
};

// For debugging; adds the "row x column" of each cell
function showCellIDs() {
	$('div#game > div:not(#droppers)').each((row, elem) => {
		$(elem).children().each((col, elem) => {
			$(elem).text(row + 'x' + col);
		});
	});
};

// Displays the board
function parseBoard(newBoard, oldBoard) {
	newBoard.forEach((row, rowI) => {
		row.forEach((col, colI) => {
			if (newBoard[rowI][colI] == oldBoard[rowI][colI]) {
				// No change; do nothing
			} else {
				console.log('Board update at', rowI, 'x', colI);
				$(`#r${rowI} #c${colI}`).append($('<div />').addClass(`p${newBoard[rowI][colI]}`));
			}
		});
	});

	console.log('Old board', oldBoard);
	console.log('New board', newBoard);
};

// Displays the winner
function parseWinner(winner) {
	if (winner == window.player) { // Current player won
		return notify(`You won`, 'win')
	} else if (winner == 3) { // Tie
		return notify(`There is a tie`, 'lose')
	} else if (winner == 0) { // No winner
	} else { // Other player won
		return notify(`Player ${winner} won`, 'lose')
	}
}

// Displays a notification and manages the notification stack
var notifyStack = 0;
function notify(message, type = '') {
	let notification = $('<div />').addClass('notification').addClass(type).text(message);
	let closeButton = $('<span class="close" aria-label="Close">&times;</span>');
	closeButton.on('click', function() {
		$(this).parent().remove();
	})
	notification.prepend(closeButton);

	$('div#notifications').append(notification);

	setTimeout(function() {
		notification.remove();
	}, 1000);
}

// Closes socket
window.addEventListener('beforeunload', function(e) {
	socket.close();
});