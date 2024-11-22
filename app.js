const express = require('express')
const socket = require('socket.io')
const http = require('http')
const path = require('path');
const {Chess} = require('chess.js');

const app = express();

app.set('view engine',"ejs")
app.use(express.static(path.join(__dirname,"public")))

app.get('/',(req,res)=>{
    res.render('index')
})

const chess = new Chess();
let players = {};
let currentPlayer = 'w';


const server = http.createServer(app);
const io = socket(server);

io.on('connection',function(uniquesocket){
    console.log('connected');

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", 'w');
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    }
    else{
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on('disconnect',function(){
        if(players.white === uniquesocket.id){
            delete players.white;
        }
        if(players.black === uniquesocket.id){
            delete players.black;
        }
    });
    uniquesocket.on("move", function(move){
        try{
            if(chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if(chess.turn() === 'b' && uniquesocket.id !== players.black) return;
            var result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move",move);
                io.emit("boardState", chess.fen());
            }else{
                console.log("Invalid Move")
                uniquesocket.emit("invalidMove","Invalid Move");
            }
        }
        catch(err){
            console.log("Error- Invalid Move");
            uniquesocket.emit("invalidMove","Invalid Move");
        }
    });
});



server.listen(3500);
