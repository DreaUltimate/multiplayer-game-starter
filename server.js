const express = require('express');
const path = require('path');
const app = express();
const server = app.listen(8000);
const io = require('socket.io')(server,  { pingInterval: 2000, pingTimeout: 5000 });

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, './public')));

const players = {}
const projectiles = {};

const speed = 15;
const radius = 8;
let projectileId = 0;

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', function (socket) {
    players[socket.id] = {
        x: Math.floor(Math.random() * 501),
        y: Math.floor(Math.random() * 501),
        color: `hsl(${Math.floor(361 * Math.random())}, 100%, 50%)`,
        sequenceNumber: 0,
        score: 0
    }

    io.emit('updatePlayers', players);

    socket.on('initCanvas', ({width, height, pixelRatio}) => {
        players[socket.id].canvas = {
            width,
            height
        }

        players[socket.id].radius = radius;

        if (pixelRatio > 1) {
            players[socket.id].radius = 2 * radius;
        }
    })

    socket.on('shoot', ({x, y, angle}) => {
        projectileId++;

        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        }

        projectiles[projectileId] = {
            x,
            y,
            velocity,
            playerId: socket.id
        }

    })

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
        for (const id in projectiles) {
            projectiles[id].x += projectiles[id].velocity.x
            projectiles[id].y += projectiles[id].velocity.y

            const projectile_radius = 2;
            if (
                projectiles[id].x - projectile_radius >=
                    players[projectiles[id].playerId]?.canvas?.width ||
                projectiles[id].x + projectile_radius <= 0 ||
                projectiles[id].y - projectile_radius >=
                    players[projectiles[id].playerId]?.canvas?.height ||
                projectiles[id].y + projectile_radius <= 0
            ) {
                delete projectiles[id];
                continue;
            }

            for (const playerId in players) {
                const player = players[playerId];

                const distance = Math.hypot(
                    projectiles[id].x - player.x,
                    projectiles[id].y - player.y
                );

                if (distance < projectile_radius + player.radius && projectiles[id].playerId !== playerId) {
                    if (projectiles[id].playerId) {
                        players[projectiles[id].playerId].score++;
                    }
                    delete projectiles[id];
                    delete players[playerId];
                    break;
                }
            }
        }
        io.emit('updateProjectiles', projectiles);
        io.emit('updatePlayers', players);
    }, 15);
})
