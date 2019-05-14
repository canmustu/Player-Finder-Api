const UserRepository = require('../repositories/user-repository');
const TokenKeyService = require('../services/token-key-service');

module.exports = (io) => {

    io.on('connection', function (socket) {

        console.log("user connected");

        socket.on('disconnect', function () {
            console.log("user disconnected");
        });

        socket.on('server', function (message) {

            // messageParam = {
            //     type: message.type,
            //     to: message.to,
            //     content: message.content,
            //     token_key: message.token_key
            // };

            // console.log("Received Message : ", JSON.stringify(message));

            // user chat
            if (message.type == 'USER_MSG') {

                // if token key is verified
                TokenKeyService.verify_token_key(message.token_key, (result_verify_token_key) => {

                    // token key is valid
                    if (result_verify_token_key.success) {

                        // from of message is filled out
                        message.from = result_verify_token_key.user.id;

                        // push message into inbox of 'to' user
                        UserRepository.push_to_inbox(message, (error, result_push_to_inbox) => {
                            if (error) return;
                            else if (result_push_to_inbox.success) {
                                // send the message by socket.io
                                io.emit(message.to,
                                    {
                                        type: message.type,
                                        from: message.from,
                                        content: message.content
                                    }
                                );
                            }
                        });
                    }
                });

            }
            // in lobby chat
            else if (
                message.type == 'LOBBY_MSG' ||
                message.type == 'LOBBY_JOIN' ||
                message.type == 'LOBBY_EXIT'
            ) {
                // if token key is verified
                TokenKeyService.verify_token_key(message.token_key, (result_verify_token_key) => {

                    // token key is valid
                    if (result_verify_token_key.success) {

                        // from of message is filled out
                        message.from = {};
                        message.from.id = result_verify_token_key.user.id;
                        message.from.username = result_verify_token_key.user.username;

                        console.log(message);

                        // send the message by socket.io
                        io.emit(message.to,
                            {
                                type: message.type,
                                from: {
                                    id: message.from.id,
                                    username: message.from.username
                                },
                                content: message.content
                            }
                        );
                    }
                });

            }
            // add friend notification
            else if (message.type == 'ADD_FRIEND') {

            }
            // do nothing
            else {

            }
        });

    });
}
