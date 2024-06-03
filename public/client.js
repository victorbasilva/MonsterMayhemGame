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
let isMonsterSelected = false;
let monsterCellData = null;

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
            renderBoard();
        }
    }else if(type == 'update'){
        updateGame(gameState);
        renderBoard();
    }else if(type == 'skipTurn'){
        updateGame(gameState);
        updateCurrentPlayer();
    }
}
// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/open_event
wsServer.onopen = () => {
    wsServer.send(JSON.stringify({type: 'getInit', }));
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

function skipTurn() {
    wsServer.send(JSON.stringify({type: 'onSkipTurn'}));
}

function startGame(gameState) {
    document.getElementById('player-names').classList.add('hidden');
    document.getElementById('board').classList.remove('hidden');
    document.getElementById('player-actions').classList.remove('hidden');
    document.getElementById('player-status').classList.remove('hidden');
    document.getElementById('combat-rules').classList.remove('hidden');
    
    updateCurrentPlayer();
    
    // Hide buttons on the home screen
    document.getElementById('insert-monster').style.display = 'inline-block';
    document.getElementById('move-monster').style.display = 'inline-block';
    document.getElementById('skip-turn').style.display = 'inline-block';

    const gamePlayerDiv = document.getElementById('game-player');
    gamePlayerDiv.classList.remove('hidden');
    gamePlayerDiv.innerHTML = `<div class="game-player-text">${gamePlayer.name}</div>`;
}

function renderBoard(gameState){
    const board = document.getElementById('board');
    board.innerHTML = '';
    console.log('renderBoard')
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

            // Adding colors based on position
            if ((i < 5 && j < 5)) {
                cell.classList.add('light-green');
            } else if((i >= 5 && j >= 5)){
                cell.classList.add('light-blue');
            } else if (i < 5 && j >= 5){
                cell.classList.add('light-gray');
            }else if  (i >= 5 && j < 5) {
                cell.classList.add('light-red');
            }

            // Add monster icon and background for each player
            const cellData = game.board[i][j];
            if (cellData) {
                const playerColor = `player-${cellData.playerId}`;
                cell.innerHTML = `<span class="${playerColor}">${game.monsterTypes[cellData.monsterType].icon}</span>`;
                cell.dataset.player = cellData.playerId;
                cell.dataset.type = cellData.monsterType;
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
    const cell = event.target.closest('td');
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (gamePlayer.name !== currentPlayer.name) {
        alert('It is not your turn!');
        return;
    }
    
    if (cell.dataset.player && cell.dataset.type) {
        const selectedPlayerId = parseInt(cell.dataset.player);
        const selectedMonsterType = parseInt(cell.dataset.type);
         // Check if the clicked monster belongs to the current player
         if (selectedPlayerId === currentPlayer.id) {
            // if is selected and we click again
            if(isMonsterSelected){
                alert(`You need to move your monster first!`);
                return;
            }
            //alert(`You selected your ${game.monsterTypes[selectedMonsterType].name}!`);
            isMonsterSelected = true;
            monsterCellData = cell.dataset;
            cell.classList.add('selected'); // Add a class to indicate selection
        } else{
            if(!isMonsterSelected){
                // add attack enemy monster logic
                cell.classList.remove('selected');
            }else{
                // The clicked monster belongs to another player, so do nothing
                alert('You cannot select a monster that belongs to another player!');
            }
        }
    }else{
        // if is empty board
        if(isMonsterSelected){
            // Move the selected monster to the clicked cell
            wsServer.send(JSON.stringify({
                type: 'moveMonster',
                playerId: currentPlayer.id,
                fromRow: parseInt(monsterCellData.row),
                fromCol: parseInt(monsterCellData.col),
                toRow: row,
                toCol: col
            }));
            isMonsterSelected = false; // Reset monster selection
            cell.classList.remove('selected'); // remove class
        }else{
            //handle monster placement
            if (isValidInsertion(currentPlayer.id, row, col)) {
                const monsterType = parseInt(prompt('Choose a monster to place: 1 (vampire), 2 (werewolf), 3 (ghost)'));
                if (!game.monsterTypes[monsterType]) {
                    alert('Invalid monster type!');
                    return;
                }
        
                wsServer.send(JSON.stringify({
                    type: 'insertMonster',
                    playerId: currentPlayer.id,
                    row: row,
                    col: col,
                    monsterType: monsterType
                }));
            } else {
                alert('You can only insert monsters within your area!');
            }
        }

    }
}

function isValidInsertion(playerId, row, col) {
    const area = game.areas[playerId];
    return (row >= area.startRow && row <= area.endRow && col >= area.startCol && col <= area.endCol);

}

/*document.getElementById('move-monster').addEventListener('click', () => {
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
});*/

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

document.addEventListener('DOMContentLoaded', (event) => {
    const players = []; // Array que armazenará os jogadores

    // Exemplo de função para adicionar um jogador (você deve adaptar isso para a lógica do seu jogo)
    function addPlayer(playerName, playerColorClass) {
        players.push({ name: playerName, colorClass: playerColorClass });
        updatePlayerList();
    }

    // Função que atualiza a tabela com os jogadores
    function updatePlayerList() {
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = ''; // Limpa a lista existente

        players.forEach(player => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = player.name;
            row.appendChild(nameCell);

            const colorCell = document.createElement('td');
            colorCell.className = player.colorClass;
            row.appendChild(colorCell);

            playerList.appendChild(row);
        });
    }

    // Exemplo de jogadores (você deve adicionar os jogadores de acordo com sua lógica)
    addPlayer('Player 1', 'player-1');
    addPlayer('Player 2', 'player-2');
    addPlayer('Player 3', 'player-3');
    addPlayer('Player 4', 'player-4');
});





