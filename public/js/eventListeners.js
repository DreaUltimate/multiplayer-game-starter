addEventListener('click', (event) => {
    const canvas = document.querySelector('canvas');
    const { top, left } = canvas.getBoundingClientRect();
    const playerPosition = {
        x: players[socket.id].x,
        y: players[socket.id].y,
    };
    const angle = Math.atan2(
        event.clientY - top - playerPosition.y,
        event.clientX - left - playerPosition.x
    );
    socket.emit('shoot', {
        x: playerPosition.x,
        y: playerPosition.y,
        angle,
    });
});
