const keys = require('../config/keys');
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
        .then(async (result_first_permission) => {
            if (result_first_permission) {
                first_permissions = result_first_permission;

                // first_permissions to temp
                sub_permissions_temp = first_permissions.sub_permissions;
            }
            else {
                result = { success: false };
            }
        });

    // 401 Unauthorized
    if (result && !result.success) return result;

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

// only for nodejs authentcation required route methods
// this checks if the user can access the route url
access_control = function (req, res, params, callback) {

    // delete slashes of end of url (http://.../../ -> last slash deleted)
    let requested_url = (keys.api_url + params.router_path + req.url).replace(/[\/]*$/, '');
    let user_role = req.user.role;

    check_permission(user_role, requested_url).then(permission => {
        if (!permission.success) {
            return res.sendStatus(401);
        }
        else {
            callback();
        }
    });
}

module.exports = {
    check_permission: check_permission,
    access_control: access_control
}
