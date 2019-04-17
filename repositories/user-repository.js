const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const encryption = require('../utilization/encryption');
const User = require('../models/user-model');
const TokenKeyService = require('../services/token-key-service');

const salt_for_password = keys.encryption.salt_for_password;

// return an object for token key claims
set_user_for_token_key = function (user) {
    return {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        username: user.username,
        role: user.role
    };
}

// user methods

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
        // if email already exists
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
    if (params.fullname) {
        query.$set.fullname = params.fullname;
    }
    if (params.password) {
        user.password = encyrpt_as_a_password(user.password);
    }

    result = await User.updateOne({ _id: params.id }, query).then(update_result => {
        return { success: update_result.nModified == 1 };
    });

    return result;
}

is_email_exists = function (email) {
    if (email) {
        User.countDocuments({ email: email }, (error, count) => {
            if (error) return callback({ code: 1001 }, null);
            // email exists
            else if (count)
                return callback({ code: 2002 }, null);
            else return callback(null, { success: true, });
        });
    }
    else return callback({ code: 2006 }, null);
}

is_username_exists = function (username) {
    if (username) {
        User.countDocuments({ username: username }, (error, count) => {
            if (error) return callback({ code: 1001 }, null);
            // email exists
            else {
                if (count) return callback(null, { success: true });
                else return callback(null, { success: false });
            }
        });
    }
    else return callback({ code: 2006 }, null);
}

// friend methods

get_user_by_id = function (id, callback) {
    User.findById(id, callback);
}

get_profile = function (user_id, callback) {
    // check if username exists
    User.findById(user_id, {
        "fullname": 1,
        "username": 1,
        "email": 1,
        "avatar": 1,
        "last_seen": 1,
        "karma_point": 1,
        "profile_visibility": 1
    }, (error, user) => {
        // if error
        if (error) return callback({ code: '1001' }, null);
        // if user not exists
        else if (!user) {
            return callback({ code: '2003' }, null);
        }

        // if profile is private
        // else if (!user.profile_visibility) {
        //     return callback({ msg: "PRIVATE-PROFILE", code: '2005' }, null);
        // }

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
        return callback({ code: '2010' }, null);
    }
    else {

        // query to check if the user is already friend
        query = { _id: target_user_id, 'friends.user.id': source_user_id };

        // check if user already friend
        User.countDocuments(query, (error, count1) => {

            // if error
            if (error) return callback({ code: '1001' }, null);

            // no friends
            else if (count1 == 0) {
                // query to check if user request already sent
                query = { _id: target_user_id, 'friend_requests.user.id': source_user_id };

                // check if user request already sent
                User.countDocuments(query, (error, count2) => {

                    // if error
                    if (error) return callback({ code: '1001' }, null);
                    // if not sent before , send friend request
                    else if (count2 == 0) {

                        // query to check if user reqest already sent
                        query = { _id: source_user_id, 'friend_requests.user.id': target_user_id };

                        // check if user reqest already sent
                        User.countDocuments(query, (error, count3) => {

                            // if error
                            if (error) return callback({ code: '1001' }, null);
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
                                        if (error) return callback({ code: '1001' }, null);
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
                        return callback({ code: '2008' }, null);
                    }
                });
            }
            // the user is already friend
            else {
                return callback({ code: '2007' }, null);
            }
        });
    }
}

accept_friend_request = function (target_user_id, source_user_id, callback) {

    // query to check if request exists
    let query = { _id: source_user_id, 'friend_requests.user.id': target_user_id };

    // check if request exists
    User.countDocuments(query, (error1, count) => {
        if (error1) return callback({ code: '1001' }, null);

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
                    if (error2) return callback({ code: '1001' }, null);
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
                                if (error3) return callback({ code: '1001' }, null);
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
                                            if (error4) return callback({ code: '1001' }, null);
                                            else return callback(null, { success: true });
                                        }
                                    );
                                }
                            }
                        );
                    }
                    else {
                        return callback({ code: '2009' }, null);
                    }
                }
            );
        }
        // no such request
        else {
            return callback({ code: '2009' }, null);
        }
    });
}

ignore_friend_request = function (target_user_id, source_user_id, callback) {

    // query to check if request exists
    let query = { _id: source_user_id, 'friend_requests.user.id': target_user_id };

    // check if request exists
    User.countDocuments(query, (error, count) => {
        if (error) return callback({ code: '1001' }, null);

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
                    if (error) return callback({ code: '1001' }, null);
                    else if (result.n > 0) return callback(null, { success: true });
                    else return callback({ code: '2009' }, null);
                }
            );
        }
        // no such request
        else {
            return callback({ code: '2009' }, null);
        }
    });
}

cancel_friend_request = function (target_user_id, source_user_id, callback) {

    // query to check if request exists
    let query = { _id: target_user_id, 'friend_requests.user.id': source_user_id };

    // check if request exists
    User.countDocuments(query, (error, count) => {
        if (error) return callback({ code: '1001' }, null);

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
                    if (error) return callback({ code: '1001' }, null);
                    else if (result.n > 0) return callback(null, { success: true });
                    else {
                        return callback({ code: '2009' }, null);
                    }
                }
            );
        }
        // no such request
        else {
            return callback({ code: '2009' }, null);
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

        if (error) return callback({ code: '1001' }, null);
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
                    if (error) return callback({ code: '1001' }, null);
                    else return callback(null, { success: true, friend_requests: users });
                });
            }
            // if zero friend request
            else {
                return callback(null, { success: true, friend_requests: [] });
            }
        }
        // no user
        else return callback({ code: '2003' }, null);
    });
}

is_friend_request = function (target_user_id, source_user_id, callback) {

    let query = {
        _id: source_user_id,
        'friend_requests.user.id': target_user_id
    };

    // check if username exists
    User.countDocuments(query, (error, count) => {
        if (error) return callback({ code: '1001' }, null);
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

        if (error) return callback({ code: '1001' }, null);
        else if (result) {
            // getting friend_ids from result
            let friend_ids = result.friends[0]; // this is array

            // if friend exist
            if (friend_ids.length) {
                query = [{ _id: { '$in': friend_ids } }, { _id: 1, username: 1, avatar: 1 }];
                User.find(...query, (error, users) => {
                    if (error) return callback({ code: '1001' }, null);
                    else return callback(null, { success: true, friends: users });
                });
            }
            // if zero friend
            else {
                return callback(null, { success: true, friends: [] });
            }
        }
        // no user
        else return callback({ code: '2003' }, null);
    });
}

remove_friend = function (target_user_id, source_user_id, callback) {

    // query to check if user exists
    let query = { _id: source_user_id, 'friends.user.id': target_user_id };

    // check if user exists
    User.countDocuments(query, (error, count) => {
        if (error) return callback({ code: '1001' }, null);

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
                    if (error) return callback({ code: '1001' }, null);
                    else if (result.n > 0) {
                        if (error) return callback({ code: '1001' }, null);
                        else return callback(null, { success: true });
                    }
                    else {
                        return callback({ code: '2009' }, null);
                    }
                }
            );
        }
        // no such request
        else {
            return callback({ code: '2009' }, null);
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
        if (error) return callback({ code: '1001' }, null);
        else return callback(null, { success: count > 0 });
    });
}

// authentication

register = function (user, callback) {
    // check if email exists
    User.countDocuments({ email: user.email }, (error_email, email_count) => {
        // if error
        if (error_email) return callback({ code: '1001_1' }, null);
        // if email exists
        if (email_count == 0) {
            // check if username exists
            User.countDocuments({ username: user.username }, (error_username, username_count) => {
                // if error
                if (error_username) return callback({ code: '1001_2' }, null);
                // if username exists
                if (username_count == 0) {
                    try {
                        // encrypt the following password
                        user.password = encyrpt_as_a_password(user.password);
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
                        return callback({ code: '1001_3' }, null);
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
            if (compare_password(encyrpt_as_a_password(user.password), existing_user.password)) {
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

check_token_key = function (authorization_header, callback) {
    // Authorization header = "JWT {token_key}"
    // first 4 characters will be deleted and be taken token key to decode
    let token_key = authorization_header.substring(4);

    jwt.verify(token_key, keys.token_key.secret, (err, decoded) => {
        return callback(err, decoded);
    });
}

//

// MOBILE SPECIFIC FUNCTIONS

login_with_google = function (user, callback) {

    User.findOne({ google: { id: user.google.id } }, (error, found_user) => {

        let returning_user = {};

        if (error) return callback({ code: 1001 }, null);
        else if (found_user) {

            // set returning_user for token key
            returning_user = set_user_for_token_key(found_user);

            return callback(null, {
                success: true,
                user: set_user_for_token_key(returning_user),
                token_key: TokenKeyService.create_token_key({ user: set_user_for_token_key(returning_user) })
            });

        } else {
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
    });
}

login_with_facebook = function (user, callback) {

    User.findOne({ facebook: { id: user.facebook.id } }, (error, existing_user) => {

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
                else return callback({ code: 2002 }, null);
            });


        }
    });
}

// broken methods

forget_password = function (email, callback) {
    const new_password = randomstring.generate({
        length: 6,
        charset: 'numeric'
    });

    User.updateOne(
        { email: email },
        { password: get_hash(new_password + keys.encryption.salt_for_password) },
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

change_passsword = function (user_id, old_password, new_password, callback) {
    User.updateOne(
        { _id: user_id, password: get_hash(old_password + salt_for_password) },
        { password: get_hash(new_password + salt_for_password) },
        (err, raw) => {
            if (err) return callback({ success: false, code: 1001 }, null)
            if (!raw.ok) return callback({ success: false, code: 700 }, null)
            if (raw.n == 0) {
                return callback(null, { success: false, code: 300 })
            } else if (raw.nModified > 0) {
                return callback(null, { success: true })
            } else {
                return callback(null, { success: false, code: 700 })
            }
        }
    )
}

//

compare_password = function (password, hash) {
    if (password === hash)
        return true;
    else
        return false;
}

get_hash = function (str, alg = 'sha256') {
    let hash = crypto.createHash(alg);
    hash.update(str);
    return hash.digest('hex');
}

encrypt_text = function (text, times) {
    for (let i = 0; i < times; i++) {
        text = get_hash(text + salt_for_password)
    }
    return text;
}

encyrpt_as_a_password = function (text) {
    return encrypt_text(text, 10);
}

module.exports = {
    set_user_for_token_key: set_user_for_token_key,
    get_user_by_id: get_user_by_id,
    register: register,
    login: login,
    forget_password: forget_password,
    change_passsword: change_passsword,
    check_token_key: check_token_key,
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
    edit_settings: edit_settings
}
