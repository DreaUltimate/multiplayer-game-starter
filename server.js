const express = require('express');
const path = require('path');
const app = express();
const server = app.listen(8000);
const io = require('socket.io')(server,  { pingInterval: 2000, pingTimeout: 5000 });

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, './public')));

const players = {}
const speed = 15;

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', function (socket) {
    players[socket.id] = {
        x: Math.floor(Math.random() * 501),
        y: Math.floor(Math.random() * 501),
        color: `hsl(${Math.floor(361 * Math.random())}, 100%, 50%)`,
        sequenceNumber: 0
    }

    io.emit('updatePlayers', players);

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', players);
    })

    socket.on('keyDown', ({keyCode, sequenceNumber}) => {
        players[socket.id].sequenceNumber = sequenceNumber;

        if (keyCode === 'KeyW' || keyCode === 'ArrowUp') {
            players[socket.id].y -= speed;
        } else if (keyCode === 'KeyA' || keyCode === 'ArrowLeft') {
            players[socket.id].x -= speed;
        } else if (keyCode === 'KeyS' || keyCode === 'ArrowDown') {
            players[socket.id].y += speed;
        } else if (keyCode === 'KeyD' || keyCode === 'ArrowRight') {
            players[socket.id].x += speed;
        }
    })

    setInterval(() => {
        io.emit('updatePlayers', players);
    }, 15);
})
