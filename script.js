document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('skip-turn').addEventListener('click', skipTurn);

const board = document.querySelector('#board table');
const playerActions = document.getElementById('player-actions');
const statusDiv = document.getElementById('status');

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


function startGame() {
    for (let i = 1; i <= 4; i++) {
        const playerName = document.getElementById(`player${i}`).value.trim();
        if (!playerName) {
            alert(`Please enter Player name ${i}`);
            return;
        }
        players.push({ name: playerName, id: i, monsterCount: 0 });
    }

    document.getElementById('player-names').classList.add('hidden');
    document.getElementById('board').classList.remove('hidden');
    document.getElementById('player-actions').classList.remove('hidden');
    document.getElementById('player-status').classList.remove('hidden');
    document.getElementById('combat-rules').classList.remove('hidden');
    
    createBoard();
    determineFirstPlayer();

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

            if ((i < 5 && j < 5) || (i >= 5 && j >= 5)) {
                cell.classList.add('light-green');
            } else if ((i < 5 && j >= 5) || (i >= 5 && j < 5)) {
                cell.classList.add('light-red');
            }
        }
    }
}


function determineFirstPlayer() {
    currentPlayerIndex = Math.floor(Math.random() * 4);
    updateCurrentPlayer();
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
    updatePlayerStatus(); // Update player status
    endTurn();
}

function endTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateCurrentPlayer();
}

document.getElementById('move-monster').addEventListener('click', () => {
    const currentPlayer = players[currentPlayerIndex];
    const monsterCells = Array.from(board.getElementsByTagName('td'))
        .filter(cell => cell.dataset.player == currentPlayer.id);

    if (monsterCells.length === 0) {
        alert('No monsters to move!');
        return;
    }

    let monsterOptions = 'Choose a monster to move:\n';
    const monstersToMove = [];

    monsterCells.forEach((cell, index) => {
        const row = cell.dataset.row;
        const col = cell.dataset.col;
        const monsterType = monsterTypes[parseInt(cell.dataset.type)].name;
        monsterOptions += `${index + 1}. ${monsterType} at (${row}, ${col})\n`;
        monstersToMove.push({ cell, row, col });
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

    updatePlayerStatus(); // Update player status
    endTurn();
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

function handleCombat(cell, incomingMonsterType) {
    const defendingMonsterType = parseInt(cell.dataset.type);
    const defendingPlayerId = parseInt(cell.dataset.player);

    if ((incomingMonsterType === 1 && defendingMonsterType === 2) ||
        (incomingMonsterType === 2 && defendingMonsterType === 3) ||
        (incomingMonsterType === 3 && defendingMonsterType === 1)) {
        cell.innerText = monsterTypes[incomingMonsterType].icon;
        cell.dataset.player = players[currentPlayerIndex].id;
        cell.dataset.type = incomingMonsterType;
        decrementMonsterCount(defendingPlayerId);
    } else if (incomingMonsterType === defendingMonsterType) {
        cell.innerText = '';
        cell.dataset.player = '';
        cell.dataset.type = '';
        decrementMonsterCount(defendingPlayerId);
        decrementMonsterCount(players[currentPlayerIndex].id);
    } else {
        decrementMonsterCount(players[currentPlayerIndex].id);
    }

    updatePlayerStatus(); // Update player status
}

function decrementMonsterCount(playerId) {
    const player = players.find(p => p.id === playerId);
    player.monsterCount--;
    player.eliminatedCount = (player.eliminatedCount || 0) + 1;

    if (player.monsterCount <= 0) {
        alert(`${player.name} was eliminated!`);
        players.splice(players.indexOf(player), 1);
        if (players.length === 1) {
            alert(`${players[0].name} won the game!`);
            resetGame();
        }
    }

    updatePlayerStatus(); // Update player status
}

function resetGame() {
    location.reload();
    // Display buttons on home screen when restarting the game
    document.getElementById('insert-monster').style.display = 'none';
    document.getElementById('move-monster').style.display = 'none';
    document.getElementById('skip-turn').style.display = 'none';
}

function skipTurn() {
    endTurn();
}

