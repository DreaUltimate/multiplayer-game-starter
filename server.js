const express = require('express');
const path = require('path');
const app = express();
const server = app.listen(8000);
const io = require('socket.io')(server);

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, './public')));


app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', function (socket) {
    socket.on('disconnect', () => {
    })
})
