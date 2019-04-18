const UserRepository = require('../repositories/user-repository');

module.exports = (io) => {

    io.on('connection', function (socket) {

        console.log("user connected");

        socket.on('disconnect', function () {
            console.log("user disconnected");
        });

        socket.on('server', function (params) {

            let message = {
                type: params.type,
                to: params.to,
                from: params.from,
                content: params.content
            };

            console.log(JSON.stringify(message));

            // user chat
            if (message.type == 'user_msg') {

                io.emit(message.to, { type: message.type, from: message.from, content: message.content });
                // UserRepository.push_to_inbox(message, (error, result) => {
                //     console.log(error, result);
                // });
            }
            // in lobby chat
            else if (message.type == 'lobby_msg') {

            }
            // add friend notification
            else if (message.type == 'add_friend') {

            }
            // do nothing
            else {

            }
        });

    });
}
