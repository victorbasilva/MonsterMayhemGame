const url = "ws://localhost:3000";
const wsServer = new WebSocket(url);

let playerName;
let game;
let currentPlayerIndex;
let players;
let monsters;
let areas;
let monsterTypes;
let isGameStarted = false;

wsServer.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const {type, gameState} = data;
    console.log(data)
    if(type == 'init'){
        if(gameState){
            updateGame(gameState);
            updatePlayers(gameState.players);
        }
    }else if(type == 'start'){
        if(gameState){
            isGameStarted = true;
            updateGame(gameState);
            startGame(gameState);
        }
    }
}
// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/open_event
wsServer.onopen = () => {
    wsServer.send(JSON.stringify({type: 'getInit'}));
};

function updateGame(gameState){
    game = gameState;
    currentPlayerIndex = gameState.currentPlayerIndex;
    players = gameState.players;
    monsters = gameState.monsters;
    areas = gameState.areas;
    monsterTypes = gameState.monsterTypes;
    console.log(gameState)
}

function updatePlayers(players){
    const playerNamesDiv = document.getElementById('player-names');
    playerNamesDiv.innerHTML = '';
    for(let i = 0; i< players.length; i++){
        let index = i+1;
        playerNamesDiv.innerHTML += `
            <input type="text" id="player${index}" value="${players[i].name}" readonly>
        `;
    }
    if(players.length < 4){
        playerNamesDiv.innerHTML += `
            <div id="waiting"> Waiting for other players to join..</div>
        `;
    }else{
        playerNamesDiv.innerHTML += `
            <button id="start-game" onclick="onStartGame()">Start Game</button>
        `;
    }
}

document.getElementById('skip-turn').addEventListener('click', skipTurn);

const board = document.querySelector('#board table');
const playerActions = document.getElementById('player-actions');
const statusDiv = document.getElementById('status');

function onStartGame(){
    wsServer.send(JSON.stringify({type: 'onStart'}));
}

function startGame(gameState) {
    document.getElementById('player-names').classList.add('hidden');
    document.getElementById('board').classList.remove('hidden');
    document.getElementById('player-actions').classList.remove('hidden');
    document.getElementById('player-status').classList.remove('hidden');
    document.getElementById('combat-rules').classList.remove('hidden');
    
    createBoard();
    updateCurrentPlayer();
    // done on server resetMonsterMovement();

    // Hide buttons on the home screen
    document.getElementById('insert-monster').style.display = 'inline-block';
    document.getElementById('move-monster').style.display = 'inline-block';
    document.getElementById('skip-turn').style.display = 'inline-block';
}

function createBoard() {
    for (let i = 0; i < 10; i++) {
        const row = board.insertRow();
        for (let j = 0; j < 10; j++) {
            const cell = row.insertCell();
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);

            // Adding numbering as a watermark
            const waterMark = document.createElement('span');
            waterMark.classList.add('watermark');
            waterMark.innerText = `${i},${j}`;
            cell.appendChild(waterMark);

            if ((i < 5 && j < 5)) {
                cell.classList.add('light-green');
            } else if((i >= 5 && j >= 5)){
                cell.classList.add('light-blue');
            } else if (i < 5 && j >= 5){
                cell.classList.add('light-gray');
            }else if  (i >= 5 && j < 5) {
                cell.classList.add('light-red');
            }
        }
    }
}

function updateCurrentPlayer() {
    const currentPlayer = players[currentPlayerIndex];
    statusDiv.innerHTML = `TURN: <strong>${currentPlayer.name}</strong>`;
    statusDiv.style.color = 'red';
    statusDiv.style.fontSize = '24px';
}

function handleCellClick(event) {
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const currentPlayer = players[currentPlayerIndex];

    if (isValidInsertion(currentPlayer, row, col)) {
        insertMonster(currentPlayer, row, col);
    } else {
        alert('You can only insert monsters within your area!');
    }
}

function isValidInsertion(player, row, col) {
    const area = areas[player.id];
    return (row >= area.startRow && row <= area.endRow && col >= area.startCol && col <= area.endCol);
}

function insertMonster(player, row, col) {
    const monsterType = parseInt(prompt('Choose a monster to place: 1 (vampire), 2 (werewolf), 3 (ghost)'));
    if (!monsterTypes[monsterType]) {
        alert('Invalid monster type!');
        return;
    }

    const cell = board.rows[row].cells[col];
    if (cell.dataset.player) {
        alert('Cell already occupied!');
        return;
    }

    cell.innerText = monsterTypes[monsterType].icon;
    cell.dataset.player = player.id;
    cell.dataset.type = monsterType;

    player.monsterCount++;
    monsters[player.id].push({ row, col, hasMoved: false }); // Add the monster with hasMoved = false

    updatePlayerStatus(); // Update player status
}

document.getElementById('move-monster').addEventListener('click', () => {
    const currentPlayer = players[currentPlayerIndex];
    const monsterCells = monsters[currentPlayer.id].filter(monster => !monster.hasMoved);

    if (monsterCells.length === 0) {
        alert('No monsters to move!');
        return;
    }

    let monsterOptions = 'Choose a monster to move:\n';
    const monstersToMove = [];

    monsterCells.forEach((monster, index) => {
        const row = monster.row;
        const col = monster.col;
        const monsterType = monsterTypes[parseInt(board.rows[row].cells[col].dataset.type)].name;
        monsterOptions += `${index + 1}. ${monsterType} at (${row}, ${col})\n`;
        monstersToMove.push(monster);
    });

    const choice = parseInt(prompt(monsterOptions)) - 1;

    if (choice < 0 || choice >= monstersToMove.length) {
        alert('Invalid choice!');
        return;
    }

    const fromRow = parseInt(monstersToMove[choice].row);
    const fromCol = parseInt(monstersToMove[choice].col);
    const toRow = parseInt(prompt('To row:'));
    const toCol = parseInt(prompt('To column:'));

    moveMonster(currentPlayer, fromRow, fromCol, toRow, toCol);
});

function moveMonster(player, fromRow, fromCol, toRow, toCol) {
    const fromCell = board.rows[fromRow].cells[fromCol];
    const toCell = board.rows[toRow].cells[toCol];

    if (fromCell.dataset.player != player.id) {
        alert('You can only move your own monsters!');
        return;
    }

    const validMove = (
        (toRow === fromRow && toCol !== fromCol) || // Horizontal move
        (toRow !== fromRow && toCol === fromCol) || // Vertical move
        (Math.abs(toRow - fromRow) <= 2 && Math.abs(toCol - fromCol) <= 2) // Diagonal move
    );

    if (!validMove) {
        alert('Invalid move!');
        return;
    }

    const monsterType = parseInt(fromCell.dataset.type);
    fromCell.innerText = '';
    fromCell.dataset.player = '';
    fromCell.dataset.type = '';

    if (toCell.dataset.player) {
        handleCombat(toCell, monsterType);
    } else {
        toCell.innerText = monsterTypes[monsterType].icon;
        toCell.dataset.player = player.id;
        toCell.dataset.type = monsterType;
    }

    const movedMonster = monsters[player.id].find(monster => monster.row === fromRow && monster.col === fromCol);
    movedMonster.row = toRow;
    movedMonster.col = toCol;
    movedMonster.hasMoved = true; // Mark as moved

    updatePlayerStatus(); // Update player status
}



function handleCombat(cell, attackingMonsterType) {
    const defendingPlayerId = parseInt(cell.dataset.player);
    const defendingMonsterType = parseInt(cell.dataset.type);

    const attackingMonster = monsterTypes[attackingMonsterType];
    const defendingMonster = monsterTypes[defendingMonsterType];

    if (!attackingMonster || !defendingMonster) {
        alert('Invalid monster types for combat!');
        return;
    }

    const attackingMonsterName = attackingMonster.name;
    const defendingMonsterName = defendingMonster.name;

    const combatRules = {
        'vampire': { 'werewolf': 'lose', 'ghost': 'win' },
        'werewolf': { 'ghost': 'lose', 'vampire': 'win' },
        'ghost': { 'vampire': 'lose', 'werewolf': 'win' }
    };

    const combatResult = combatRules[attackingMonsterName][defendingMonsterName];

    if (combatResult === 'win') {
        alert(`${attackingMonsterName} wins against ${defendingMonsterName}!`);
        removeMonsterFromList(defendingPlayerId, cell.dataset.row, cell.dataset.col);
        cell.innerText = monsterTypes[attackingMonsterType].icon;
        cell.dataset.player = players[currentPlayerIndex].id;
        cell.dataset.type = attackingMonsterType;
    } else {
        alert(`${defendingMonsterName} wins against ${attackingMonsterName}!`);
        removeMonsterFromList(players[currentPlayerIndex].id, cell.dataset.row, cell.dataset.col);
        cell.innerText = monsterTypes[defendingMonsterType].icon;
        cell.dataset.player = defendingPlayerId;
        cell.dataset.type = defendingMonsterType;
    }
}

function removeMonsterFromList(playerId, row, col) {
    monsters[playerId] = monsters[playerId].filter(monster => monster.row != row || monster.col != col);
}

function skipTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateCurrentPlayer();
    resetMonsterMovement();
}

function updatePlayerStatus() {
    const statusTableBody = document.querySelector('#status-table tbody');
    statusTableBody.innerHTML = ''; // Clear previous status

    players.forEach(player => {
        const row = document.createElement('tr');
        const playerNameCell = document.createElement('td');
        const monsterCountCell = document.createElement('td');
        const eliminatedCountCell = document.createElement('td');

        playerNameCell.textContent = player.name;
        monsterCountCell.textContent = player.monsterCount;
        eliminatedCountCell.textContent = player.eliminatedCount || 0;

        row.appendChild(playerNameCell);
        row.appendChild(monsterCountCell);
        row.appendChild(eliminatedCountCell);
        statusTableBody.appendChild(row);
    });
}




