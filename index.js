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
gameState.currentPlayerIndex = currentPlayerIndex;
gameState.started = false;

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
                // Move the monster
                gameState.board[toRow][toCol] = gameState.board[fromRow][fromCol];
                gameState.board[fromRow][fromCol] = null;

                // Update monster position
                const movedMonsterIndex = gameState.monsters[playerId].findIndex(monster => monster.row === fromRow && monster.col === fromCol);
                if (movedMonsterIndex !== -1) {
                    gameState.monsters[playerId][movedMonsterIndex].row = toRow;
                    gameState.monsters[playerId][movedMonsterIndex].col = toCol;
                    gameState.monsters[playerId][movedMonsterIndex].hasMoved = true;
                }
            } else {
                // Invalid move, send error message to client
                ws.send(JSON.stringify({ type: 'error',message:'Invalid move!' }));
            }
            // Send updated game state to all clients
            wsServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'update', gameState }));
                }
            });
        }else if(type=="attackMonster"){
            const { playerId, fromRow, fromCol, toRow, toCol } = data;
             // Check if the move is valid
            if (isValidMove(playerId, fromRow, fromCol, toRow, toCol, true)) {
                gameState = handleAttackMonster(data);
                wsServer.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'update', gameState }));
                    }
                });
            } else {
                // Invalid move, send error message to client
                ws.send(JSON.stringify({ type: 'error',message:'Invalid move!' }));
                
            }
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
            monsterType: monsterType,
            hasMoved: true // Set hasMoved to true for a newly placed monster
        };
        if (!gameState.monsters[playerId]) {
            gameState.monsters[playerId] = [];
        }
        // placing monster sets hasMoved to true so it cant be moved this turn
        gameState.monsters[playerId].push({ row, col, monsterType, hasMoved: true });
        gameState.players.find(player => player.id === playerId).monsterCount++;
        gameState.players.find(player => player.id === playerId).placed++;
    }
    return gameState;
}

function isValidInsertion(playerId, row, col) {
    const area = gameState.areas[playerId];
    return (row >= area.startRow && row <= area.endRow && col >= area.startCol && col <= area.endCol);
}

function resetMonsterMovement(gameState, currentPlayerIndex) {
    /*let playerId = gameState.players[currentPlayerIndex].id;
    if (gameState.monsters[playerId]) {
        gameState.monsters[playerId].forEach(monster => {
            monster.hasMoved = false;
            gameState.board[monster.row][monster.col].hasMoved = false;
        });
    }*/
    // Iterate over all players
    Object.values(gameState.monsters).forEach(playerMonsters => {
        // Iterate over all monsters for each player
        playerMonsters.forEach(monster => {
            // Reset the hasMoved flag for each monster
            monster.hasMoved = false;
            gameState.board[monster.row][monster.col].hasMoved = false;
        });
    });
    return gameState;
}

function getRandomPlayerIndex(){
    return Math.floor(Math.random() * 4);
}

function isValidMove(playerId, fromRow, fromCol, toRow, toCol, isAttack = false) {
    const targetCell = gameState.board[toRow][toCol];
    const movingMonster = gameState.board[fromRow][fromCol];
    // if he already moved this turn
    if (movingMonster.hasMoved) {
        console.log('Invalid move: Monster has already moved this turn.');
        return false;
    }
    // Check if the move is within bounds
    if (!isInBounds(toRow, toCol)) {
        return false;
    }

    
    if (!isAttack) {
        // For normal moves, the target cell must be empty or contain the player's own monster
        if (targetCell && targetCell.playerId !== playerId) {
            return false; // Path blocked by another player's monster
        }
    } else {
        // For attack moves, the target cell must contain an enemy monster
        if (!targetCell || targetCell.playerId === playerId) {
            return false; // No enemy monster to attack
        }
    }

    // Check if the move is horizontal, vertical, or diagonal within 2 squares
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    if ((fromRow === toRow || fromCol === toCol) || (rowDiff === colDiff && rowDiff <= 2)) {
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

            // Check if the current cell contains another player's monster
            if (gameState.board[currentRow][currentCol] && gameState.board[currentRow][currentCol].playerId !== playerId) {
                return false; // Path blocked by another player's monster
            }

            // Move to the next cell
            currentRow += rowIncrement;
            currentCol += colIncrement;
        }
        movingMonster.hasMoved = true; // Set hasMoved to true after a valid move
        return true; // Valid move
    }

    return false; // Invalid move
}

function handleAttackMonster(data) {
    const { playerId, fromRow, fromCol, toRow, toCol } = data;
    const attackingMonster = gameState.board[fromRow][fromCol];
    const defendingMonster = gameState.board[toRow][toCol];
    console.log(attackingMonster)
    console.log(defendingMonster)
    if (!attackingMonster || !defendingMonster) {
        console.log('Invalid attack: one of the monsters does not exist.');
        return gameState; // Return gameState even if no changes are made
    }
    
    const attackType = gameState.monsterTypes[attackingMonster.monsterType].name;
    const defendType = gameState.monsterTypes[defendingMonster.monsterType].name;

    const combatRules = {
        'vampire': { 'werewolf': 'win', 'ghost': 'lose' },
        'werewolf': { 'ghost': 'win', 'vampire': 'lose' },
        'ghost': { 'vampire': 'win', 'werewolf': 'lose' }
    };

    const result = combatRules[attackType][defendType];

    if (result === 'win') {
        // Attacking monster wins
        removeMonster(defendingMonster.playerId, toRow, toCol);
        gameState.board[toRow][toCol] = attackingMonster;
        gameState.board[fromRow][fromCol] = null;
        updateMonsterPosition(attackingMonster.playerId, fromRow, fromCol, toRow, toCol);
        updatePlayerMonsterCount(defendingMonster.playerId, -1);
    } else if (result === 'lose') {
        // Defending monster wins
        removeMonster(attackingMonster.playerId, fromRow, fromCol);
        updatePlayerMonsterCount(attackingMonster.playerId, -1);
    } else {
        // Handle draw case if applicable
        console.log('Draw case: No monster wins.');
    }

    return gameState; // Return the updated game state
}

function updateMonsterPosition(playerId, fromRow, fromCol, toRow, toCol) {
    const monster = gameState.monsters[playerId].find(m => m.row === fromRow && m.col === fromCol);
    if (monster) {
        monster.row = toRow;
        monster.col = toCol;
    }
}

function updatePlayerMonsterCount(playerId, change) {
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        player.alive += change;
    }
}

function removeMonster(playerId, row, col) {
    const monsters = gameState.monsters[playerId];
    gameState.monsters[playerId] = monsters.filter(m => m.row !== row || m.col !== col);
    gameState.board[row][col] = null;
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
    //if there is no name redirect back to player creation
    if(!name){
        res.redirect("/" );
        return;
    }
    // if there is already 4 players redirect
    if(players.length >=4 ){
        res.redirect("/" );
        return;
    }
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
    if (name.length < 6) {
        res.status(400).send("Name must be at least 6 characters long.");
        return;
    }
    req.session.name = name;
    res.redirect("/index");
});
