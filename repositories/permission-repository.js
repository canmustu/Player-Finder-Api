const mongoose = require('mongoose');
const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');

const Permission = require('../models/permission-model');

// 
check_permission = function (role, requested_url, callback) {
    let sub_permissions_temp;
    let sub_permissions_group;

    Permission.find({ role: role }, { _id: 0, url_permissions: 1, sub_permissions: 1 }, (error_first_permissions, first_permissions) => {
        // TODO: set error area
        if (error_first_permissions) return callback({ error: { msg: error_first_permissions, code: '1' } }, null);
        else {
            sub_permissions_temp = [...first_permissions];
            console.log(sub_permissions_temp);
            sub_permissions_group = [...sub_permissions_temp];
            console.log(sub_permissions_group);

            while (sub_permissions_temp.length) { // sonsuz döngüde
                Permission.aggregate(
                    [
                        {
                            $match: { _id: { $in: sub_permissions_temp } }
                        },
                        {
                            $group:
                            {
                                _id: null,
                                sub_permissions: { $push: '$sub_permissions' }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                sub_permissions: {
                                    $reduce: {
                                        input: '$sub_permissions',
                                        initialValue: [],
                                        in: { $setUnion: ['$$value', '$$this'] }
                                    }
                                }
                            }
                        }
                    ], (error_aggregate, result_aggregate) => {
                        console.log(error_aggregate);
                        if (error_aggregate) return callback({ error: { msg: error, code: '2' } }, null);
                        sub_permissions_temp = result_aggregate.sub_permissions;

                        sub_permissions_group = [...sub_permissions_group, ...sub_permissions_temp];
                    }
                );
            }

            let res = [...new Set([...sub_permissions_group])];
            console.log(res);
        }
    })
}

module.exports = {
    check_permission: check_permission
}