const mongoose = require('mongoose');
const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');
require('../enums/link-type-enum');

const Permission = require('../models/permission-model');
const Link = require('../models/link-model');

// bozuk
check_permission2 = function (role, requested_url, callback) {
    let sub_permissions_temp;
    let sub_permissions;

    Permission.findOne({ role: role }, { _id: 0, url_permissions: 1, sub_permissions: 1 }, (error_first_permissions, first_permissions) => {
        // TODO: set error area
        if (error_first_permissions) return callback({ error: { msg: error_first_permissions, code: '1' } }, null);
        else {
            sub_permissions_temp = first_permissions.sub_permissions;
            sub_permissions = [...sub_permissions_temp];

            while (sub_permissions_temp.length) {
                console.log("temp : ", sub_permissions_temp);
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
                        console.log("error : ", error_aggregate);
                        if (error_aggregate) return callback({ error: { msg: error_aggregate, code: '2' } }, null);

                        sub_permissions_temp = result_aggregate[0].sub_permissions;
                        console.log("temp2 : ", sub_permissions_temp);

                        sub_permissions = [...sub_permissions, ...sub_permissions_temp];
                        console.log("sub_permissions : ", sub_permissions);
                    }
                );
            }

            let res = [...new Set([...sub_permissions])];
            console.log("sonuç : ", res);
        }
    })
}

// check permission for requested url
check_permission = async function (role, requested_url) {
    let sub_permissions_temp; // temp sub permissions
    let sub_permissions; // total sub permissions

    // find first sub permissions
    await Permission.findOne({ role: role }, { _id: 0, url_permissions: 1, sub_permissions: 1 }).then(async (first_permissions) => {
        // first_permissions to temp
        sub_permissions_temp = first_permissions.sub_permissions;
        // adding to sub_permissions
        sub_permissions = [...sub_permissions_temp];

        let aggregation_result;

        // iterative query here..
        // for ex :
        // 1 => 4 // 1 has 4
        // 4 => 5 // 4 has 5
        // user has [1,4] permissions in database
        // so user has [1,4,5] permissions finally

        // if temp is not empty
        while (sub_permissions_temp.length) {

            aggregation_result = await Permission.aggregate(
                [
                    {
                        $match: { _id: { $in: sub_permissions_temp } }
                    },
                    {
                        $group:
                        {
                            _id: null,
                            sub_permissions: { $push: '$sub_permissions' },
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
                ]
            );

            // result to temp
            sub_permissions_temp = aggregation_result[0].sub_permissions;

            // temp to sub_permissions
            console.log(sub_permissions);
            sub_permissions = [sub_permissions, sub_permissions_temp];
            console.log(sub_permissions);
            sub_permissions = [...new Set(sub_permissions)]
        }

        // do this for unique
        let res = [...new Set(...sub_permissions)];
        console.log("result : ", res);
    })
}

// check permission for requested url
check_permission3 = async function (role, requested_url) {
    let result;

    let sub_permissions_temp; // temp sub permissions
    let sub_permissions; // sub permissions
    let url_permissions; // sub permissions

    // find first sub permissions
    await Permission.findOne({ role: role }, { _id: 0, url_permissions: 1, sub_permissions: 1 })
        .then(async (first_permissions) => {

            // first_permissions to temp
            sub_permissions_temp = first_permissions.sub_permissions;

            // adding to sub_permissions
            sub_permissions = [...sub_permissions_temp];

            // adding to url_permissions
            url_permissions = [...first_permissions.url_permissions]

            // for aggregation result
            let aggregation_result;

            // iterative query here..
            // for ex :
            // 1 => 4 // 1 has 4
            // 4 => 5 // 4 has 5
            // user has [1,4] permissions in database
            // so user has [1,4,5] permissions finally

            // if temp is not empty
            while (sub_permissions_temp.length) {

                aggregation_result = await Permission.aggregate(
                    [
                        {
                            $match: { _id: { $in: sub_permissions_temp } }
                        },
                        {
                            $group:
                            {
                                _id: null,
                                sub_permissions: { $push: '$sub_permissions' },
                                url_permissions: { $push: '$url_permissions' }
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
                                },
                                url_permissions: {
                                    $reduce: {
                                        input: '$url_permissions',
                                        initialValue: [],
                                        in: { $setUnion: ['$$value', '$$this'] }
                                    }
                                }
                            }
                        }
                    ]
                );

                // result sub_permission to temp
                sub_permissions_temp = aggregation_result[0].sub_permissions;

                // add temp to sub_permissions
                sub_permissions = [...sub_permissions, ...sub_permissions_temp];

                // add result url_permissions to url_permissions
                url_permissions = [...url_permissions, ...aggregation_result[0].url_permissions];
            }

            // do this for unique
            url_permissions = [...new Set(url_permissions.map(item => { return item.toString() }))];

            // get id of the link
            await Link.findOne({ url: requested_url }, { _id: 1 }).then(link => {
                if (link && link._id) {
                    // check if user has permission for the link
                    permission = url_permissions.indexOf(link._id.toString()) !== -1;
                    // assign to result
                    result = { success: permission };
                }
                else {
                    result = { success: false };
                }
            })
        })

        return result;
}

module.exports = {
    check_permission: check_permission3
}
