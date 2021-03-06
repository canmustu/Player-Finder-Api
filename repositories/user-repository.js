const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user-model');
const TokenKeyService = require('../services/token-key-service');
const EncryptionService = require('../services/encryption-service');

// return an object for token key claims
set_user_for_token_key = function (user) {
    return {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar
    };
}

// user methods

get_user_by_id = function (id, callback) {
    User.findById(id, callback);
}

get_user_by_username = function (username, callback) {
    User.findOne({ username: username }, { _id: 1 }, (error, user) => {
        // if error
        if (error) return callback({ code: 1001 }, null);
        // if user not exists
        else if (!user) return callback({ code: 2003 }, null);
        // if user exists
        else return get_profile(user._id, callback);
    });
}

edit_settings = async function (params) {

    let result;

    let query =
    {
        $set: {
        }
    };

    if (params.email) {
        // if email already exists
        result = await User.countDocuments({ email: params.email }).then(count => {
            if (count) {
                return { success: false, error: { code: 2002 } };
            } else {
                query.$set.email = params.email;
            }
        });
        if (result) return result;
    }
    if (params.username) {
        // if username already exists
        result = await User.countDocuments({ username: params.username }).then(count => {
            if (count) {
                return { success: false, error: { code: 2001 } };
            } else {
                query.$set.username = params.username;
            }
        });
        if (result) return result;
    }
    if (params.gender) {
        query.$set.gender = params.gender;
    }
    if (params.facebook_url) {
        query.$set["contact.facebook_url"] = params.facebook_url;
    }
    if (params.discord_url) {
        query.$set["contact.discord_url"] = params.discord_url;
    }
    if (params.fullname) {
        query.$set.fullname = params.fullname;
    }
    if (params.password) {
        query.$set.password = EncryptionService.encyrpt_as_a_password(params.password);
    }
    if (params.birth_date) {
        try {
            query.$set.birth_date = new Date(params.birth_date);
        }
        catch (e) {
        }
    }

    result = await User.updateOne({ _id: params.id }, query).then(update_result => {
        return { success: update_result.nModified == 1 };
    });

    return result;
}

// lobby methods

is_lobby_exist_on_user = function (user_id, callback) {
    User.findById(user_id, (error, user) => {
        // if error
        if (error) return callback({ code: 1001 }, null);
        // if user exists
        else if (user) return callback(null, { success: user.lobby_id ? true : false });
        // if user not exist
        else return callback({ code: 2003 }, null);
    });
}

exit_lobby = function (user_id, callback) {
    User.updateOne(
        { _id: user_id },
        { $unset: { lobby_id: 1 } },
        (error, result) => {
            if (error) return callback({ code: 1001 }, null);
            else return callback(null, { success: result.nModified ? true : false });
        });
}

join_lobby = function (user_id, lobby_id, callback) {
    User.updateOne(
        { _id: user_id },
        { $set: { lobby_id: lobby_id } },
        (error, result) => {
            if (error) return callback({ code: 1001 }, null);
            else return callback(null, { success: result.nModified ? true : false });
        });
}

// messages methods

push_to_inbox = function (message, callback) {
    // query to check if request exists
    let query = { _id: { $in: [message.from, message.to] } };

    // check if request exists
    User.countDocuments(query, (error, count) => {
        if (error) return callback({ code: 1001 }, null);

        // to and from exist
        else if (count == 2) {

            // push message into inbox of 'to' user
            User.updateOne(
                { _id: message.to },
                {
                    '$push': {
                        inbox: {
                            from: {
                                user: {
                                    id: message.from
                                }
                            },
                            message: message.content,
                            received_at: new Date()
                        }
                    },
                }, (error, result) => {
                    if (error) return callback({ code: 1001 }, null);
                    else if (result.n > 0) return callback(null, { success: true });
                    else return callback({ code: 2011 }, null);
                }
            );
        }
        // no user exist
        else {
            return callback({ code: 2003 }, null);
        }
    });
}

get_conversation = function (target_user_id, source_user_id, callback) {
    inbox = [];

    User.aggregate([
        { "$match": { _id: { $in: [mongoose.Types.ObjectId(target_user_id), mongoose.Types.ObjectId(source_user_id)] } } },
        { "$unwind": "$inbox" },
        { "$match": { "inbox.from.user.id": { $in: [mongoose.Types.ObjectId(source_user_id), mongoose.Types.ObjectId(target_user_id)] } } },
        {
            "$group": {
                "_id": null,
                "inbox": { "$push": "$inbox" }
            }
        }
    ], (error, result) => {
        // if error
        if (error) return callback({ code: 1001 }, null);
        else if (!result.length) return callback(null, { success: true, inbox: [] });
        else if (result[0].inbox) {
            // sort by received_at field
            result[0].inbox.sort(function (a, b) {
                return new Date(a.received_at) - new Date(b.received_at);
            });

            return callback(null, { success: true, inbox: result[0].inbox });
        }
        else return callback({ code: 1001 }, null);
    });
}

get_inbox = function (source_user_id, callback) {
    User.aggregate([
        {
            $unwind: "$inbox"
        },
        {
            $addFields: {
                participants: ["$_id", "$inbox.from.user.id"]
            }
        },
        {
            $match: { participants: mongoose.Types.ObjectId(source_user_id) }
        },
        {
            $addFields: {
                participants: {
                    $filter: {
                        input: "$participants",
                        cond: {
                            $ne: ["$$this", mongoose.Types.ObjectId(source_user_id)]
                        }
                    }
                }
            }
        },
        {
            $unwind: "$participants"
        },
        {
            $sort: { "inbox.received_at": -1 }
        },
        {
            $group: {
                _id: "$participants",
                content: { $first: "$inbox.message" }
            }
        }
    ], (error1, result) => {
        if (error1) return callback({ code: 1001 }, null);
        else {
            // get user ids from inbox
            let id_array = result.map(item => item._id);

            User.find({ _id: { $in: id_array } }, { avatar: 1, username: 1 }, (error2, users) => {
                if (error2) return callback({ code: 1001 }, null);
                else {

                    // set user's username for result
                    result.forEach(item => {
                        item.username = users.find(x => x._id.toString() == item._id.toString()).username;
                    });

                    return callback(null, { success: true, inbox: result });
                }
            });
        }

    });
}

// friend methods

get_profile = function (user_id, callback) {
    // check if username exists
    User.findById(user_id, {
        "fullname": 1,
        "username": 1,
        "gender": 1,
        "email": 1,
        "avatar": 1,
        "contact": 1,
        "birth_date": 1,
        "lobby_id": 1,
        "last_seen": 1,
        "karma_point": 1,
        "profile_visibility": 1
    }, (error, user) => {
        // if error
        if (error) return callback({ code: 1001 }, null);
        // if user not exists
        else if (!user) {
            return callback({ code: 2003 }, null);
        }
        // if username exists
        else {
            return callback(null, { success: true, user: user });
        }
    });
}

add_friend = function (target_user_id, source_user_id, callback) {

    let query;

    // if same user
    if (target_user_id == source_user_id) {
        return callback({ code: 2010 }, null);
    }
    else {

        // query to check if the user is already friend
        query = { _id: target_user_id, 'friends.user.id': source_user_id };

        // check if user already friend
        User.countDocuments(query, (error, count1) => {

            // if error
            if (error) return callback({ code: 1001 }, null);

            // no friends
            else if (count1 == 0) {
                // query to check if user request already sent
                query = { _id: target_user_id, 'friend_requests.user.id': source_user_id };

                // check if user request already sent
                User.countDocuments(query, (error, count2) => {

                    // if error
                    if (error) return callback({ code: 1001 }, null);
                    // if not sent before , send friend request
                    else if (count2 == 0) {

                        // query to check if user reqest already sent
                        query = { _id: source_user_id, 'friend_requests.user.id': target_user_id };

                        // check if user reqest already sent
                        User.countDocuments(query, (error, count3) => {

                            // if error
                            if (error) return callback({ code: 1001 }, null);
                            // no request received
                            else if (count3 == 0) {
                                User.updateOne(
                                    { _id: target_user_id }, // condition
                                    {
                                        $push: {
                                            friend_requests: {
                                                user: {
                                                    id: source_user_id,
                                                    requested_at: new Date()
                                                }
                                            }
                                        }
                                    }, (error, result) => {
                                        if (error) return callback({ code: 1001 }, null);
                                        else if (result.n) return callback(null, { success: true });
                                        else return callback({ code: 2003 }, null);
                                    }
                                );
                            }
                            // the request already received
                            else {
                                // pull friend request and push to friends
                                accept_friend_request(target_user_id, source_user_id, callback);
                            }
                        });
                    }
                    // the request already sent
                    else {
                        return callback({ code: 2008 }, null);
                    }
                });
            }
            // the user is already friend
            else {
                return callback({ code: 2007 }, null);
            }
        });
    }
}

accept_friend_request = function (target_user_id, source_user_id, callback) {

    // query to check if request exists
    let query = { _id: source_user_id, 'friend_requests.user.id': target_user_id };

    // check if request exists
    User.countDocuments(query, (error1, count) => {
        if (error1) return callback({ code: 1001 }, null);

        // if request exists
        else if (count > 0) {
            // pull friend from friends_requests field
            User.updateOne(
                { _id: source_user_id }, // condition
                {
                    '$pull': {
                        friend_requests: {
                            "user.id": target_user_id
                        }
                    },
                }, (error2, result_pull) => {
                    if (error2) return callback({ code: 1001 }, null);
                    else if (result_pull.n > 0) {

                        // push friend to friends field - for source user
                        User.updateOne(
                            { _id: source_user_id }, // condition
                            {
                                '$push': {
                                    friends: {
                                        "user": {
                                            "id": target_user_id
                                        }
                                    }
                                }
                            }, (error3, result_push_source) => {
                                if (error3) return callback({ code: 1001 }, null);
                                else {
                                    // push friend to friends field - for source user
                                    User.updateOne(
                                        { _id: target_user_id }, // condition
                                        {
                                            '$push': {
                                                friends: {
                                                    "user": {
                                                        "id": source_user_id
                                                    }
                                                }
                                            }
                                        }, (error4, result_push_target) => {
                                            if (error4) return callback({ code: 1001 }, null);
                                            else return callback(null, { success: true });
                                        }
                                    );
                                }
                            }
                        );
                    }
                    else {
                        return callback({ code: 2009 }, null);
                    }
                }
            );
        }
        // no such request
        else {
            return callback({ code: 2009 }, null);
        }
    });
}

ignore_friend_request = function (target_user_id, source_user_id, callback) {

    // query to check if request exists
    let query = { _id: source_user_id, 'friend_requests.user.id': target_user_id };

    // check if request exists
    User.countDocuments(query, (error, count) => {
        if (error) return callback({ code: 1001 }, null);

        // friend request exists
        else if (count > 0) {
            // pull friend from friends_requests field
            User.updateOne(
                { _id: source_user_id }, // condition
                {
                    '$pull': {
                        friend_requests: {
                            "user.id": target_user_id
                        }
                    },
                }, (error, result) => {
                    if (error) return callback({ code: 1001 }, null);
                    else if (result.n > 0) return callback(null, { success: true });
                    else return callback({ code: 2009 }, null);
                }
            );
        }
        // no such request
        else {
            return callback({ code: 2009 }, null);
        }
    });
}

cancel_friend_request = function (target_user_id, source_user_id, callback) {

    // query to check if request exists
    let query = { _id: target_user_id, 'friend_requests.user.id': source_user_id };

    // check if request exists
    User.countDocuments(query, (error, count) => {
        if (error) return callback({ code: 1001 }, null);

        // friend request exists
        else if (count > 0) {
            // pull friend from friends_requests field
            User.updateOne(
                { _id: target_user_id }, // condition
                {
                    '$pull': {
                        friend_requests: {
                            "user.id": source_user_id
                        }
                    },
                }, (error, result) => {
                    if (error) return callback({ code: 1001 }, null);
                    else if (result.n > 0) return callback(null, { success: true });
                    else {
                        return callback({ code: 2009 }, null);
                    }
                }
            );
        }
        // no such request
        else {
            return callback({ code: 2009 }, null);
        }
    });
}

get_friend_requests = function (user_id, callback) {

    let query = [
        {
            $match: { _id: mongoose.Types.ObjectId(user_id) }
        },
        {
            $group: {
                _id: null,
                friend_requests: { $push: "$friend_requests.user.id" }
            }
        }
    ];

    // getting friend requests of user
    User.aggregate(query, (error, result) => {
        // array to object cast
        result = result[0];

        if (error) return callback({ code: 1001 }, null);
        else if (result) {
            // getting friend_requests_ids from result
            let friend_request_ids = result.friend_requests[0]; // this is array

            // if friend request exist
            if (friend_request_ids.length) {
                query = [
                    {
                        _id: {
                            '$in': friend_request_ids
                        }
                    },
                    {
                        _id: 1,
                        username: 1,
                        avatar: 1
                    }
                ];

                User.find(...query, (error, users) => {
                    if (error) return callback({ code: 1001 }, null);
                    else return callback(null, { success: true, friend_requests: users });
                });
            }
            // if zero friend request
            else {
                return callback(null, { success: true, friend_requests: [] });
            }
        }
        // no user
        else return callback({ code: 2003 }, null);
    });
}

is_friend_request = function (target_user_id, source_user_id, callback) {

    let query = {
        _id: source_user_id,
        'friend_requests.user.id': target_user_id
    };

    // check if username exists
    User.countDocuments(query, (error, count) => {
        if (error) return callback({ code: 1001 }, null);
        else return callback(null, { success: count > 0 });
    });
}

get_friends = function (user_id, callback) {

    let query = [
        {
            $match: { _id: mongoose.Types.ObjectId(user_id) }
        },
        {
            $group: {
                _id: null,
                friends: { $push: "$friends.user.id" }
            }
        }
    ];

    // getting friends of user
    User.aggregate(query, (error, result) => {
        // array to object cast
        result = result[0];

        if (error) return callback({ code: 1001 }, null);
        else if (result) {
            // getting friend_ids from result
            let friend_ids = result.friends[0]; // this is array

            // if friend exist
            if (friend_ids.length) {
                query = [{ _id: { '$in': friend_ids } }, { _id: 1, username: 1, avatar: 1 }];
                User.find(...query, (error, users) => {
                    if (error) return callback({ code: 1001 }, null);
                    else return callback(null, { success: true, friends: users });
                });
            }
            // if zero friend
            else {
                return callback(null, { success: true, friends: [] });
            }
        }
        // no user
        else return callback({ code: 2003 }, null);
    });
}

remove_friend = function (target_user_id, source_user_id, callback) {

    // query to check if user exists
    let query = { _id: source_user_id, 'friends.user.id': target_user_id };

    // check if user exists
    User.countDocuments(query, (error, count) => {
        if (error) return callback({ code: 1001 }, null);

        // friend exists
        else if (count > 0) {
            // pull user from friends field
            User.updateOne(
                { _id: source_user_id }, // condition
                {
                    '$pull': {
                        friends: {
                            "user.id": target_user_id
                        }
                    },
                }, (error, result) => {
                    if (error) return callback({ code: 1001 }, null);
                    else if (result.n > 0) {
                        if (error) return callback({ code: 1001 }, null);
                        else return callback(null, { success: true });
                    }
                    else {
                        return callback({ code: 2009 }, null);
                    }
                }
            );
        }
        // no such request
        else {
            return callback({ code: 2009 }, null);
        }
    });
}

is_friend = function (target_user_id, source_user_id, callback) {

    let query = {
        _id: source_user_id,
        'friends.user.id': { $in: [target_user_id] }
    };

    // check if username exists
    User.countDocuments(query, (error, count) => {
        if (error) return callback({ code: 1001 }, null);
        else return callback(null, { success: count > 0 });
    });
}

// authentication

register = function (user, callback) {
    // check if email exists
    User.countDocuments({ email: user.email }, (error_email, email_count) => {
        // if error
        if (error_email) return callback({ code: 1001 }, null);
        // if email exists
        if (email_count == 0) {
            // check if username exists
            User.countDocuments({ username: user.username }, (error_username, username_count) => {
                // if error
                if (error_username) return callback({ code: 1001 }, null);
                // if username exists
                if (username_count == 0) {
                    try {
                        // encrypt the following password
                        user.password = EncryptionService.encyrpt_as_a_password(user.password);
                        // insert to db
                        user
                            .save()
                            .then(new_user => {
                                // register successful
                                return callback(null, {
                                    success: true,
                                    user: set_user_for_token_key(new_user),
                                    token_key: TokenKeyService.create_token_key({ user: set_user_for_token_key(new_user) })
                                });
                            });
                    } catch (error) {
                        return callback({ code: 1001 }, null);
                    }
                } else {
                    // username already exists
                    return callback({ code: 2001 }, null);
                }
            })
        } else {
            // email already exists
            return callback({ code: 2002 }, null);
        }
    })
}

login = function (user, callback) {
    query = { $or: [{ username: user.username_or_email }, { email: user.username_or_email }] };

    // check if user exists
    User.findOne(query, (error, existing_user) => {
        // if error
        if (error) return callback({ code: 1001 }, null);
        // if user exists
        if (existing_user) {
            // compare password
            if (compare_password(EncryptionService.encyrpt_as_a_password(user.password), existing_user.password)) {
                // login successful
                return callback(null, {
                    success: true,
                    user: set_user_for_token_key(existing_user),
                    token_key: TokenKeyService.create_token_key({ user: set_user_for_token_key(existing_user) })
                });
            } else {
                // wrong password
                return callback({ code: 2004 }, null);
            }
        } else {
            // username not exists
            return callback({ code: 2003 }, null);
        }
    })
}

// START - MOBILE SPECIFIC FUNCTIONS

login_with_google = function (user, callback) {

    User.findOne({ "google.id": user.google.id }, (error, found_user) => {

        let returning_user = {};

        if (error) return callback({ code: 1001 }, null);

        // login
        else if (found_user) {
            // set returning_user for token key
            returning_user = set_user_for_token_key(found_user);

            return callback(null, {
                success: true,
                user: set_user_for_token_key(returning_user),
                token_key: TokenKeyService.create_token_key({ user: set_user_for_token_key(returning_user) })
            });
        }

        // register
        else {
            User.findOne({ email: user.email }, (error, found_user) => {
                if (error) return callback({ code: 1001 }, null);
                // email not exist , then register
                else if (!found_user) {
                    const new_user = new User({
                        fullname: user.fullname,
                        email: user.email,
                        avatar: user.avatar,
                        google: {
                            id: user.google.id
                        }
                    });

                    new_user.username = "ISIMSIZ_" + new_user._id;

                    // avatar of google size changed
                    if (new_user.avatar) new_user.avatar = new_user.avatar.replace("sz=50", "sz=200");

                    new_user
                        .save()
                        .then(usr => {

                            // set returning_user for token key
                            returning_user = set_user_for_token_key(usr);

                            return callback(null, {
                                success: true,
                                user: set_user_for_token_key(returning_user),
                                token_key: TokenKeyService.create_token_key({ user: set_user_for_token_key(returning_user) })
                            });
                        });
                }
                // email exists , not register
                else {
                    return callback({ code: 2002 }, null);
                }
            });
        }
    });
}

login_with_facebook = function (user, callback) {

    User.findOne({ "facebook.id": user.facebook.id }, (error, existing_user) => {

        let returning_user = {};

        if (error) return callback({ code: 1001 }, null);

        // login
        else if (existing_user) {

            // set returning_user for token key
            returning_user = set_user_for_token_key(existing_user);

            return callback(null, {
                success: true,
                user: set_user_for_token_key(returning_user),
                token_key: TokenKeyService.create_token_key({ user: set_user_for_token_key(returning_user) })
            });

        }

        // register
        else {
            User.findOne({ email: user.email }, (error, found_user) => {
                if (error) return callback({ code: 1001 }, null);
                // email not exist , then register
                else if (!found_user) {

                    const new_user = new User({
                        fullname: user.fullname,
                        email: user.email,
                        facebook: {
                            id: user.facebook.id
                        }
                    });

                    new_user.username = "ISIMSIZ_" + new_user._id;

                    new_user
                        .save()
                        .then(usr => {

                            // set returning_user for token key
                            returning_user = set_user_for_token_key(usr);

                            return callback(null, {
                                success: true,
                                user: set_user_for_token_key(returning_user),
                                token_key: TokenKeyService.create_token_key({ user: set_user_for_token_key(returning_user) })
                            });
                        });
                }
                // email exists , not register
                else {
                    return callback({ code: 2002 }, null);
                }
            });
        }

    });
}

// END - MOBILE SPECIFIC FUNCTIONS

// broken method
forget_password = function (email, callback) {
    const new_password = randomstring.generate({
        length: 6,
        charset: 'numeric'
    });

    User.updateOne(
        { email: email },
        { password: EncryptionService.get_hash_with_salt(new_password) },
        (err, raw) => {
            if (err) return callback({ success: false }, null)
            if (!raw.ok) return callback({ success: false, code: 700 }, null)
            if (raw.n == 0) {
                return callback(null, { success: false, code: 300 })
            } else if (raw.nModified > 0) {

                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: '..@gmail.com',
                        pass: '..'
                    }
                });

                var mailOptions = {
                    from: '👥 .. 👥 <..@gmail.com>',
                    to: email,
                    subject: 'Şifremi Unuttum',
                    text: 'Yeni Şifreniz : ' + new_password
                };

                transporter.sendMail(mailOptions, function (err, result) {
                    if (err) {
                        return callback({ success: false }, null)
                    } else {
                        return callback(null, { success: true })
                    }
                });

            } else {
                return callback(null, {
                    success: false,
                    code: 500
                })
            }
        }
    )
}

compare_password = function (password, hash) {
    if (password === hash)
        return true;
    else
        return false;
}

module.exports = {
    set_user_for_token_key: set_user_for_token_key,
    get_user_by_id: get_user_by_id,
    register: register,
    login: login,
    forget_password: forget_password,
    get_profile: get_profile,
    add_friend: add_friend,
    accept_friend_request: accept_friend_request,
    get_friends: get_friends,
    get_friend_requests: get_friend_requests,
    is_friend: is_friend,
    is_friend_request: is_friend_request,
    ignore_friend_request: ignore_friend_request,
    cancel_friend_request: cancel_friend_request,
    remove_friend: remove_friend,
    login_with_google: login_with_google,
    login_with_facebook: login_with_facebook,
    edit_settings: edit_settings,
    push_to_inbox: push_to_inbox,
    get_user_by_username: get_user_by_username,
    get_conversation: get_conversation,
    get_inbox: get_inbox,
    is_lobby_exist_on_user: is_lobby_exist_on_user,
    exit_lobby: exit_lobby,
    join_lobby: join_lobby
}
