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
const projectiles = {};

socket.on('connect', () => {
    socket.emit('initCanvas', { width: canvas.width, height: canvas.height, pixelRatio });
})

const speed = 15;
const playerInputs = [];
let sequenceNumber = 0;

socket.on('updateProjectiles', (data) => {
    for (const id in data) {
        const projectile = data[id];

        if (!projectiles[id]) {
            projectiles[id] = new Projectile({
                x: projectile.x,
                y: projectile.y,
                radius: 5,
                color: players[projectile.playerId]?.color,
                velocity: projectile.velocity
            });
        } else {
            projectiles[id].x += data[id].velocity.x
            projectiles[id].y += data[id].velocity.y
        }
    }

    for (const id in projectiles) {
        if (!data[id]) {
            delete projectiles[id];
        }
    }
});

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

            $('#playerLabels').append(
                `<div data-id="${id}" data-score="${newPlayer.score}">${id}: ${newPlayer.score}</div>`
            )
        } else {
            //sorting
            document.querySelector(`div[data-id="${id}"]`).innerHTML = `${id}: ${newPlayer.score}`;
            document.querySelector(`div[data-id="${id}"]`).setAttribute('data-score', newPlayer.score);
            const parentDiv = document.querySelector(`#playerLabels`);
            const childDivs = Array.from(parentDiv.querySelectorAll('div'));

            childDivs.sort((a, b) => {
                const scoreA =  Number(a.getAttribute('data-score'));
                const scoreB =  Number(b.getAttribute('data-score'));


                return scoreB - scoreA;
            })

            childDivs.forEach(div => {
                parentDiv.removeChild(div);
            })

            childDivs.forEach(div => {
                parentDiv.appendChild(div);
            })

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
            const divToDelete = document.querySelector(`div[data-id="${id}"]`);
            divToDelete.parentNode.removeChild(divToDelete);
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

    for (const id in projectiles) {
        const projectile = projectiles[id];
        projectile.draw();
    }

    // for (let i = projectiles.length - 1; i >= 0; i--) {
    //     const projectile = projectiles[i];
    //     projectile.update();
    // }
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
