const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const socket = io();
const scoreEl = document.querySelector('#scoreEl');
const pixelRatio = window.devicePixelRatio || 1;

canvas.width = innerWidth * pixelRatio;
canvas.height = innerHeight * pixelRatio;

const x = canvas.width / 2;
const y = canvas.height / 2;

const players = {};
const speed = 15;
const playerInputs = [];
let sequenceNumber = 0;

socket.on('updatePlayers', (data) => {
    for (const id in data) {
        const newPlayer = data[id];

        if (!players[id]) {
            players[id] = new Player({
                x: newPlayer.x,
                y: newPlayer.y,
                radius: 8,
                color: newPlayer.color
            });
        } else {
            if (id === socket.id) {
                players[id].x = newPlayer.x
                players[id].y = newPlayer.y

                const lastPlayerInput = playerInputs.findIndex( input => {
                    return data.sequenceNumber === input.sequenceNumber;
                })

                if (lastPlayerInput > -1) {
                    playerInputs.splice(0, lastPlayerInput + 1);

                    playerInputs.forEach( input => {
                        players[id].x += input.dx;
                        players[id].y += input.dy;
                    })
                }
            } else {
                players[id].x = newPlayer.x
                players[id].y = newPlayer.y
            }
        }

    }

    for (const id in players) {
        if (!data[id]) {
            delete players[id];
        }
    }
});

let animationId;

function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);

    for (const id in players) {
        const player = players[id];
        player.draw();
    }
}

animate();

const keys =  {
    w: { pressed: false, },
    a: { pressed: false, },
    s: { pressed: false, },
    d: { pressed: false, },
    up: { pressed: false, },
    left: { pressed: false, },
    right: { pressed: false, },
    down: { pressed: false, }
}

setInterval(() => {
    if (keys.w.pressed || keys.up.pressed) {
        sequenceNumber++;
        playerInputs[playerInputs.length] = { sequenceNumber, dx: 0, dy: -speed }
        players[socket.id].y -= speed;
        socket.emit('keyDown', { keyCode: 'KeyW', sequenceNumber });
    }
    if (keys.a.pressed || keys.left.pressed) {
        sequenceNumber++;
        playerInputs[playerInputs.length] = { sequenceNumber, dx: -speed, dy: 0 }
        players[socket.id].x -= speed;
        socket.emit('keyDown', { keyCode: 'KeyA', sequenceNumber });
    }
    if (keys.s.pressed || keys.down.pressed) {
        sequenceNumber++;
        playerInputs[playerInputs.length] = { sequenceNumber, dx: 0, dy: speed }
        players[socket.id].y += speed;
        socket.emit('keyDown', { keyCode: 'KeyS', sequenceNumber });
    }
    if (keys.d.pressed || keys.right.pressed) {
        sequenceNumber++;
        playerInputs[playerInputs.length] = { sequenceNumber, dx: speed, dy: 0 }
        players[socket.id].x += speed;
        socket.emit('keyDown', { keyCode: 'KeyD', sequenceNumber });
    }
}, 15);

window.addEventListener('keydown', (e) => {
    if (!players[socket.id]) {
        return;
    }

    let key = e.code;

    if (key === 'KeyW') { keys.w.pressed = true;}
    else if (key === 'KeyA') { keys.a.pressed = true; }
    else if (key === 'KeyS') { keys.s.pressed = true; }
    else if (key === 'KeyD') { keys.d.pressed = true; }
    else if (key === 'ArrowUp') { keys.up.pressed = true; }
    else if (key === 'ArrowLeft') { keys.left.pressed = true; }
    else if (key === 'ArrowDown') { keys.down.pressed = true; }
    else if (key === 'ArrowRight') { keys.right.pressed = true; }
})

window.addEventListener('keyup', (e) => {
    if (!players[socket.id]) {
        return;
    }

    let key = e.code;

    if (key === 'KeyW') { keys.w.pressed = false; }
    else if (key === 'KeyA') { keys.a.pressed = false; }
    else if (key === 'KeyS') { keys.s.pressed = false; }
    else if (key === 'KeyD') { keys.d.pressed = false; }
    else if (key === 'ArrowUp') { keys.up.pressed = false; }
    else if (key === 'ArrowLeft') { keys.left.pressed = false; }
    else if (key === 'ArrowDown') { keys.down.pressed = false; }
    else if (key === 'ArrowRight') { keys.right.pressed = false; }
})
