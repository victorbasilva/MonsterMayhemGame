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

wsServer.on('connection', (ws, req) => {
    console.log('A user connected');
    ws.on('message', (message) => {
        const data = JSON.parse(message); 
        
        if(data.type == 'getInit'){
            wsServer.clients.forEach(client => {
                if (client.readyState == WebSocket.OPEN) client.send(JSON.stringify({type:'init', gameState}));
            })
        } else if(data.type == 'onStart'){
            currentPlayerIndex = getRandomPlayerIndex();
            gameState.currentPlayerIndex = currentPlayerIndex;
            gameState = resetMonsterMovement(gameState, currentPlayerIndex);
            wsServer.clients.forEach(client => {
                if (client.readyState == WebSocket.OPEN) client.send(JSON.stringify({type:'start', gameState}));
            })
        }
    });
     
    ws.on('close', () => {
        console.log('A user disconnected');
    });
});

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
    res.render("index.ejs", {gameState} );
});

app.post("/enter-game", (req, res) => {
    const name = req.body.name;
    req.session.name = name    
    res.redirect("/index");
});

