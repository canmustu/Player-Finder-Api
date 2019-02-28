const mongoose = require('mongoose');
const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');
require('../enums/link-type-enum');

const Permission = require('../models/permission-model');
const Link = require('../models/link-model');

// check permission for requested url
check_permission = async function (role, requested_url) {
    let result;

    let sub_permissions_temp; // temp sub permissions
    let url_permissions; // url permissions
    let aggregation_result; // for aggregation result

    let first_permissions; // first query result

    // find first sub permissions
    await Permission.findOne({ role: role }, { _id: 0, url_permissions: 1, sub_permissions: 1 })
        .then(async (first_permission_result) => {

            first_permissions = first_permission_result;

            // first_permissions to temp
            sub_permissions_temp = first_permissions.sub_permissions;
        });

    // adding to url_permissions
    url_permissions = [...first_permissions.url_permissions.map(item => { return item.toString() })];

    // if temp is not empty
    while (sub_permissions_temp.length) {

        // iterative query here..
        // for ex :
        // 1 => 4 // 1 has 4
        // 4 => 5 // 4 has 5
        // user has [1,4] permissions in database
        // so user has [1,4,5] permissions finally
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

        // aggregation_result's sub_permission to temp
        sub_permissions_temp = aggregation_result[0].sub_permissions;

        // allowed urls are being adding to url_permissions UNIQUELY
        url_permissions = [
            ...new Set(
                [
                    ...url_permissions,
                    ...aggregation_result[0].url_permissions.map(item => { return item.toString() })
                ]
            )
        ];

    }

    // check permission
    await Link.findOne({ url: requested_url }, { _id: 1 }).then(link => {
        if (link && link._id) {
            // check if user has permission for the link
            permission_success = url_permissions.indexOf(link._id.toString()) !== -1;

            // 200 Success or 401 Unauthorized
            result = { success: permission_success };
        }
        else {
            // 401 Unauthorized
            result = { success: false };
        }
    })

    return result;
}

module.exports = {
    check_permission: check_permission
}
