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
    statusDiv.innerText = `TURN: ${currentPlayer.name}`;
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

    const fromRow = parseInt(prompt('Move row monster:'));
    const fromCol = parseInt(prompt('Move column monster:'));
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
        (Math.abs(toRow - fromRow) <= 2 && Math.abs(toCol - fromCol) == 0) ||
        (Math.abs(toRow - fromRow) == 0 && Math.abs(toCol - fromCol) <= 2) ||
        (Math.abs(toRow - fromRow) <= 2 && Math.abs(toCol - fromCol) <= 2)
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

    endTurn();
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
}

function decrementMonsterCount(playerId) {
    const player = players.find(p => p.id === playerId);
    player.monsterCount--;
    if (player.monsterCount <= 0) {
        alert(`${player.name} was eliminated!`);
        players.splice(players.indexOf(player), 1);
        if (players.length === 1) {
            alert(`${players[0].name} won the game!`);
            resetGame();
        }
    }
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


