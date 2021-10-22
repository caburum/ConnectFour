class Game {
	constructor() {
		this.winner = 0;
		this.currentPlayer = 1;
		this.board = [
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0]
		];
	};
	update(col) {
		if (this.winner != 0) { // There is a winner
			return false;
		}

		let row = this.dropPiece(col);
		if (row != false) { // A piece can be dropped in this column
			if (this.checkForWin(row, col)) { // There is now a winner
				this.winner = this.currentPlayer;
			} else if (this.checkForDraw()) { // There is now a draw
				this.winner = 3;
			}
			this.togglePlayer(); // Next player
			return true; // Game can continue
		}
		return false; // Nothing to change
	};
	togglePlayer() {
		if (this.currentPlayer == 1) {
			this.currentPlayer = 2;
		} else if (this.currentPlayer == 2) {
			this.currentPlayer = 1;
		}
		return this.currentPlayer;
	};
	dropPiece(col) {
		if (col >= 0 && col < this.board[0].length) {
			for (var row = this.board.length - 1; row >= 0; row--) {
				if (this.board[row][col] === 0) {
					this.board[row][col] = this.currentPlayer;
					// console.log('dropping at row id', row)
					return row;
				}
			}
			return false;
		}
	};
	isInBounds(row, col) { // Checks if a position is within the game board
		return row >= 0 && row < this.board.length && col >= 0 && col < this.board[0].length;
	};
	countInARow(row, col, rowD, colD) { // Figures out if there are 4 pieces in a row going in a straight direction from a position
		const player = this.currentPlayer; // The player to operate on
		var sum = 1; // Number in a row; count the starting point

		// console.log('starting at', row, col, 'going toward', rowD, colD)

		// Move forward through the line from starting point
		var rowI = row;
		var colI = col;

		while (true) {
			rowI += rowD;
			colI += colD;

			// console.log('f', rowI, colI, 'sum', sum)

			if (!this.isInBounds(rowI, colI)) { // If cell being checked is out of bounds
				// console.log('f oob', rowI, colI)
				break;
			}

			if (this.board[rowI][colI] !== player) { // If there is a non-current-player piece in the way
				// console.log('f break')
				break;
			}

			sum++; // The player's piece is in line; repeat
		}

		// Move backward through the line from starting point
		var rowI = row;
		var colI = col;

		while (true) {
			rowI -= rowD;
			colI -= colD;

			// console.log('b', rowI, colI, 'sum', sum)

			if (!this.isInBounds(rowI, colI)) { // If cell being checked is out of bounds
				// console.log('b oob', rowI, colI)
				break;
			}

			if (this.board[rowI][colI] !== player) { // If there is a non-current-player piece in the way
				// console.log('b break')
				break;
			}

			sum++; // The player's piece is in line; repeat
		}

		// console.log(sum)
		return sum;
	};
	checkForWin(row, col) { // Checks if there can be a win based on last placed piece
		const threshold = 4;

		let vertical = this.countInARow(row, col, 1, 0) >= threshold; // ⬍
		let horizontal = this.countInARow(row, col, 0, 1) >= threshold; // ⬌
		let diagonalLeft = this.countInARow(row, col, 1, 1) >= threshold; // ⤡
		let diagonalRight = this.countInARow(row, col, 1, -1) >= threshold; // ⤢

		return vertical || horizontal || diagonalLeft || diagonalRight; // If any are true there is a win
	};
	checkForDraw() {
		return this.board[0].reduce((draw, val) => {
			return draw && val !== 0;
		}, true);
	}
}

module.exports = Game;