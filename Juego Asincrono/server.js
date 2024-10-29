const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3001;

let gameState = {
    board: Array(9).fill(''),
    currentPlayer: 'X',
    winner: null,
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


io.on('connection', (socket) => {
    console.log('Nuevo jugador conectado');

    const player = gameState.currentPlayer === 'X' ? 'O' : 'X';
    socket.emit('assignPlayer', player);
    gameState.currentPlayer = player;

    io.emit('gameState', gameState);

    socket.on('makeMove', (data) => {
        if (gameState.board[data.index] === '' && gameState.winner === null) {
            gameState.board[data.index] = data.player;
            gameState.currentPlayer = data.player === 'X' ? 'O' : 'X';

            const winningCombination = checkWin(gameState.board);
            if (winningCombination) {
                gameState.winner = data.player;
                io.emit('gameOver', { winner: data.player, combination: winningCombination, board: gameState.board });
            } else if (gameState.board.every(cell => cell !== '')) {
                io.emit('gameOver', { winner: 'Empate', combination: [], board: gameState.board });
            } else {
                io.emit('gameState', gameState);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Jugador desconectado');
        resetGame();
    });
});

function checkWin(board) {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
        [0, 4, 8], [2, 4, 6]             // Diagonales
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return combination;
        }
    }
    return null;
}

function resetGame() {
    gameState = {
        board: Array(9).fill(''),
        currentPlayer: 'X',
        winner: null,
    };
    io.emit('gameState', gameState);
}

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://10.0.3.150:${PORT}`);
});
