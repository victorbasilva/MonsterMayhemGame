const url = "ws://localhost:3000";
const wsServer = new WebSocket(url);

let game;
let currentPlayer;
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
        updateGame(gameState);
        updatePlayers(gameState.players);
    }else if(type == 'start'){
        isGameStarted = true;
        updateGame(gameState);
        startGame(gameState);
        renderBoard();
    }else if(type == 'update'){
        updateGame(gameState);
        renderBoard();
    }else if(type == 'skipTurn'){
        updateGame(gameState);
        updateCurrentPlayer();
        renderBoard(gameState);
    }else if (type == 'error'){
        alert(data.message);
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
    currentPlayer = players[currentPlayerIndex];
    updatePlayerList(players);
    //updatePlayerStatus();
    // update current game player with values from server after each game update
    gamePlayer = players.find(player=> player.id == gamePlayer.id);
    if(gamePlayer.alive == 0){
        alert('Game over! You lost all your monsters!');
        return;
    }
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
    if (gamePlayer.name !== currentPlayer.name) {
        alert('It is not your turn!');
        return;
    }
    wsServer.send(JSON.stringify({type: 'onSkipTurn'}));
}

function startGame(gameState) {
    document.getElementById('player-names').classList.add('hidden');
    document.getElementById('board').classList.remove('hidden');
    document.getElementById('player-actions').classList.remove('hidden');
    //document.getElementById('player-status').classList.remove('hidden');
    document.getElementById('combat-rules').classList.remove('hidden');
    
    updateCurrentPlayer();
    
    // Hide buttons on the home screen
    document.getElementById('skip-turn').style.display = 'inline-block';

    const gamePlayerDiv = document.getElementById('game-player');
    gamePlayerDiv.classList.remove('hidden');
    const playerColor = `player-${gamePlayer.id}`;
    gamePlayerDiv.innerHTML = `<div class="game-player-text player ${playerColor}">${gamePlayer.name}</div>`;
}

function renderBoard(gameState){
    const board = document.getElementById('board');
    board.innerHTML = '';
    
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
                // Check if the monster has already moved
                if (cellData.hasMoved) {
                    cell.classList.add('has-moved');
                    cell.removeEventListener('click', handleCellClick);
                }else{
                    cell.classList.remove('has-moved');
                    cell.addEventListener('click', handleCellClick);
                }
            }
        }
    }    
}


function updateCurrentPlayer() {
    currentPlayer = players[currentPlayerIndex];
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
    if(game){
        const cellData = game.board[row][col];
        // Prevent selection if the monster has already moved
        if (cellData && cellData.hasMoved) {
            alert('This monster has already moved this turn.');
            return;
        }
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
            // if monster is not selected, prevent selecting monster from other player
            if(!isMonsterSelected){
                // The clicked monster belongs to another player, so do nothing
                alert('You cannot select a monster that belongs to another player!');
            }else{
                // add attack enemy monster logic
                wsServer.send(JSON.stringify({
                    type: 'attackMonster',
                    playerId: currentPlayer.id,
                    fromRow: parseInt(monsterCellData.row),
                    fromCol: parseInt(monsterCellData.col),
                    toRow: row,
                    toCol: col
                }));
                cell.classList.remove('selected');
                isMonsterSelected = false;
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
            // prevent insertion more than 10 monsters
            if(gamePlayer.placed == 10){
                alert('You placed all your monsters!')
                return;
            }
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


/*function updatePlayerStatus() {
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
}*/

function updatePlayerList(players) {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = ''; // Clears the existing list

    players.forEach(player => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = player.name;
        row.appendChild(nameCell);

        const colorCell = document.createElement('td');
        colorCell.className = `player-${player.id}`;
        row.appendChild(colorCell);

        const placedMonsterCell = document.createElement('td');
        placedMonsterCell.textContent = `${player.placed} /10`;
        row.appendChild(placedMonsterCell);

        const aliveMonstersCell = document.createElement('td');
        aliveMonstersCell.textContent = `${player.alive} /10`;
        row.appendChild(aliveMonstersCell);

        playerList.appendChild(row);
    });
}





