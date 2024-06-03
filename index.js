const express = require("express");
const session = require('express-session'); 
const ejs = require("ejs");
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require("body-parser");
const PORT = (process.argv[2] || 3000);
app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secret', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));
const httpServer = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
const wsServer = new WebSocket.Server( { noServer: true } );
httpServer.on('upgrade', async (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
    });
});

let gameState = {};

let currentPlayerIndex = 0;
const players = [];
const monsters = { 1: [], 2: [], 3: [], 4: [] };
const areas = {
    1: { startRow: 0, endRow: 4, startCol: 0, endCol: 4 },
    2: { startRow: 0, endRow: 4, startCol: 5, endCol: 9 },
    3: { startRow: 5, endRow: 9, startCol: 0, endCol: 4 },
    4: { startRow: 5, endRow: 9, startCol: 5, endCol: 9 }
};
const monsterTypes = {
    1: { name: 'vampire', icon: '🧛' },
    2: { name: 'werewolf', icon: '🐺' },
    3: { name: 'ghost', icon: '👻' }
};
gameState.monsters = monsters;
gameState.areas = areas;
gameState.monsterTypes = monsterTypes;
gameState.players;
gameState.board = Array.from({ length: 10 }, () => Array(10).fill(null));

wsServer.on('connection', (ws, req) => {
    console.log('A user connected');
    ws.on('message', (message) => {
        const data = JSON.parse(message); 
        const type = data.type;
        if(type == 'getInit'){
            wsServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({type:'init', gameState}));
                }
            })
        } else if(type == 'onStart'){
            currentPlayerIndex = getRandomPlayerIndex();
            gameState.currentPlayerIndex = currentPlayerIndex;
            gameState = resetMonsterMovement(gameState, currentPlayerIndex);
            wsServer.clients.forEach(client => {
                if (client.readyState == WebSocket.OPEN){
                    client.send(JSON.stringify({type:'start', gameState}));
                } 
            })
        }else if (type == 'insertMonster') {
            gameState = handleMonsterInsertion(gameState, data.playerId, data.row, data.col, data.monsterType);
            wsServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'update', gameState }));
                }
            });
        }else if(type =='onSkipTurn'){
            currentPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
            gameState.currentPlayerIndex = currentPlayerIndex;
            gameState = resetMonsterMovement(gameState, currentPlayerIndex);
            wsServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'skipTurn', gameState }));
                }
            });
        } else if(type =='moveMonster'){
            const { playerId, fromRow, fromCol, toRow, toCol } = data;
           
            // Check if the move is valid
            if (isValidMove(playerId, fromRow, fromCol, toRow, toCol)) {
                console.log('isValidMove')
                // Move the monster
                gameState.board[toRow][toCol] = gameState.board[fromRow][fromCol];
                gameState.board[fromRow][fromCol] = null;

                // Update monster position
                const movedMonsterIndex = gameState.monsters[playerId].findIndex(monster => monster.row === fromRow && monster.col === fromCol);
                console.log(movedMonsterIndex)
                if (movedMonsterIndex !== -1) {
                    gameState.monsters[playerId][movedMonsterIndex].row = toRow;
                    gameState.monsters[playerId][movedMonsterIndex].col = toCol;
                    gameState.monsters[playerId][movedMonsterIndex].hasMoved = true;
                }
            } else {
                // Invalid move, send error message to client
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid move!' }));
            }
            console.log(gameState)
            // Send updated game state to all clients
            wsServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'update', gameState }));
                }
            });
        }
    });
     
    ws.on('close', () => {
        console.log('A user disconnected');
    });
});

function handleMonsterInsertion(gameState, playerId, row, col, monsterType) {
    if (isValidInsertion(playerId, row, col)) {
        gameState.board[row][col] = {
            playerId: playerId,
            monsterType: monsterType
        };
        if (!gameState.monsters[playerId]) {
            gameState.monsters[playerId] = [];
        }
        gameState.monsters[playerId].push({ row, col, monsterType, hasMoved: false });
        gameState.players.find(player => player.id === playerId).monsterCount++;
    }
    return gameState;
}

function isValidInsertion(playerId, row, col) {
    const area = gameState.areas[playerId];
    return (row >= area.startRow && row <= area.endRow && col >= area.startCol && col <= area.endCol);
}

function resetMonsterMovement(gameState, currentPlayerIndex){
    let players = gameState.players;
    gameState.monsters[players[currentPlayerIndex].id].forEach(monster => {
        monster.hasMoved = false;
    });
    return gameState;
}

function getRandomPlayerIndex(){
    return Math.floor(Math.random() * 4);
}
function isValidMove(playerId, fromRow, fromCol, toRow, toCol) {
    // Check if the target cell is empty or contains the player's monster
    const targetCell = gameState.board[toRow][toCol];
    if (!targetCell || targetCell.playerId === playerId) {
        // Check if the move is horizontal, vertical, or diagonal
        if (fromRow === toRow || fromCol === toCol || Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol)) {
            const rowIncrement = Math.sign(toRow - fromRow);
            const colIncrement = Math.sign(toCol - fromCol);

            let currentRow = fromRow + rowIncrement;
            let currentCol = fromCol + colIncrement;

            // Iterate over the path between the starting and target positions
            while (currentRow !== toRow || currentCol !== toCol) {
                // Check if the current cell is within bounds
                if (currentRow < 0 || currentRow >= 10 || currentCol < 0 || currentCol >= 10) {
                    return false; // Out of bounds
                }

                // Check if the current cell contains the player's monster
                if (gameState.board[currentRow][currentCol] && gameState.board[currentRow][currentCol].playerId !== playerId) {
                    return false; // Path blocked by another player's monster
                }

                // Move to the next cell
                currentRow += rowIncrement;
                currentCol += colIncrement;
            }

            return true; // Valid move
        }
    }

    return false; // Invalid move
}




function isInBounds(row, col) {
    return row >= 0 && row < 10 && col >= 0 && col < 10; // Adjust for your game board size
}

function isCellEmpty(row, col) {
    return !gameState.board[row][col]; // Check if the cell is null or undefined
}


// SERVER ROUTES
app.get("/", (req, res) => {
    res.render("player.ejs", {gameState} );
});

app.get("/index", (req, res) => {
    const name = req.session.name;
    console.log(name)
    req.session.name = null; 
    gameState.started = true;
    let player = players.find(player=>player.name == name);
    if(!player){
        player = {
            name: name,
            monsters: 10,
            placed: 0,
            alive: 10,
            win:0,
            lose:0,
            id: players.length + 1
        };
        players.push(player);
    }
    gameState.currentPlayerIndex = 0;
    gameState.players = players; 
    res.render("index.ejs", {gameState, player} );
});

app.post("/enter-game", (req, res) => {
    const name = req.body.name;
    req.session.name = name    
    res.redirect("/index");
});

