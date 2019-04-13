const UserRepository = require('../repositories/user-repository');

module.exports = (io) => {

    io.on('connection', function (socket) {

        console.log("user connected");

        socket.on('disconnect', function () {
            console.log("user disconnected");
        });

        socket.on('server', function (message) {
            console.log(JSON.stringify(message));
            io.emit(message.to, { from: message.from, content: message.content });
            if (message.type == 'lobby') {

            } else if (message.type == 'user') {
                UserRepository.push_to_inbox(message, (error, result) => {
                    console.log(error, result);
                })
            }
        });

    });
}
