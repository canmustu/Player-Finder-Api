const UserRepository = require('../repositories/user-repository');

module.exports = (io) => {

    io.on('connection', function (socket) {

        socket.on('disconnect', function () {
        });

        socket.on('server', function (message) {
            console.log(JSON.stringify(message));
            io.emit(message.to, { from: message.from, content: message.content });
            if (message.type == 'group') {

            } else if (message.type == 'user') {
                UserRepository.receive_message(message, (error, result) => {
                    console.log(error, result);
                })
            }
        });

    });
}
