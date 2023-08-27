// const e = require('express');
const { POOL, QUERY } = require('../database');
const error = require('../Others/error');
const tool = require('../Others/tool');
// const redisClient = require('../redisClient');

module.exports = {
    poolConnection: async () => {
        return new Promise((resolve, reject) => {
            POOL.getConnection((err, connection) => {
                if (err) {
                    console.error('connecting failed');
                    reject(err);
                } else {
                    console.log('connecting success');
                    resolve(connection);
                }
            });
        });
    },
    signup: async (res, name, email, password) => {
        const connection = await module.exports.poolConnection();
        if (!name || !email || !password) return error.input(res);
        if (!await tool.checkEmail(email)) {
            return error.emailFormat(res);
        }
        try {
            const provider = "native";
            const searchEmail = await QUERY('SELECT * FROM users WHERE email = ?', [email]);
            if (searchEmail.length > 0) {
                return error.emailExist(res);
            }
            const hashPassword = await tool.generateHashSync(password);
            const insertUsers = await QUERY('INSERT INTO users (name, email, password, provider,friend_count) VALUES (?, ?, ?, ?,?)', [name, email, hashPassword, provider, 0]);
            const userId = insertUsers.insertId;
            const user = { id: userId, provider, name, email, picture: "null" };
            res.status(200).json({
                data: {
                    access_token: await tool.generateAccessToken(user),
                    user
                }
            });
        } catch (error1) {
            error.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    signin: async (res, provider, email, password) => {
        const connection = await module.exports.poolConnection();
        try {
            if (!email || !password) return error.input(res);
            const loginUser = await QUERY('SELECT * FROM users WHERE email = ?', [email]);
            if (loginUser.length == 0) return error.userNotFound(res);
            if(! await tool.confirmPassword(password, loginUser[0].password)) return error.wrongPassword(res);


            const user = {
                id: loginUser[0].id,
                provider,
                name: loginUser[0].name,
                email,
                picture: loginUser[0].picture
            }

            res.status(200).json({
                data: {
                    access_token: await tool.generateAccessToken(user),
                    user
                }
            });
        } catch (error1) {
            error.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    profile: async (res, redisClient, actualUserId, userId) => {
        const connection = await module.exports.poolConnection();
        try {
            const userProfileKey = `userProfile:${actualUserId}`;

            const profileCache = await redisClient.get(userProfileKey);
            const friendKey = `friend:${actualUserId}&${userId}`;
            const friendCache = await redisClient.get(friendKey);

            if (profileCache != null) {
                const user = JSON.parse(profileCache);
                if (friendCache != null) {
                    const friendObj = JSON.parse(friendCache);
                    const status = friendObj.status;
                    const fid = friendObj.id;
                    if (user.friendship == null) {
                        const x = {
                            id: fid,
                            status
                        }
                        user.friendship = x;
                    } else {
                        user.friendship.status = status;
                    }

                }else{
                    user.friendship=null;
                }
                console.log(user.friendship);
                const userKey = `user:${actualUserId}`;
                const userCache = await redisClient.get(userKey);
                if (userCache != null) {
                    const userObj = JSON.parse(userCache);
                    const count = userObj.friends.length;
                    user.friend_count = count;
                }
                console.log(`${actualUserId}~~`);
                const output = {
                    id: actualUserId,
                    name: user.name,
                    picture: user.picture,
                    friend_count: user.friend_count,
                    introduction: user.introduction,
                    tags: user.tags,
                    friendship: user.friendship
                };
                const userJSON = JSON.stringify(user);
                await redisClient.SETEX(userProfileKey, 10800, userJSON, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
                res.status(200).json({
                    data: {
                        user: output
                    }
                });
            } else {
                const targetProfile = await QUERY('SELECT * FROM users WHERE id = ?', [actualUserId]);
                if (targetProfile.length == 0) {
                    return error.userNotFound(res);
                }

                const findFriendshipResult = await QUERY('SELECT * FROM friendship WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)', [actualUserId, userId, userId, actualUserId]);
                let friendship = null;
                if (findFriendshipResult.length > 0) {
                    friendship = {
                        id: findFriendshipResult[0].id,
                        status: findFriendshipResult[0].status
                    }
                }

                const user = {
                    id: actualUserId,
                    name: targetProfile[0].name,
                    picture: targetProfile[0].picture,
                    friend_count: targetProfile[0].friend_count,
                    introduction: targetProfile[0].introduction,
                    tags: targetProfile[0].tags,
                    friendship: friendship
                };
                res.status(200).json({
                    data: {
                        user
                    }
                });

                const userProfileJSONString = JSON.stringify(user);
                const expireTimeInSeconds = 360;
                const userProfileKey = `userProfile:${user.id}`;
                await redisClient.SETEX(userProfileKey, expireTimeInSeconds, userProfileJSONString, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
            }

        } catch (error1) {
            error.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    profileUpdate: async (res, redisClient, name, introduction, tags, userId) => {
        const connection = await module.exports.poolConnection();
        try {
            if (!userId) return error.input(res);
            const updateResult = await QUERY('UPDATE users SET name = ?, introduction = ?, tags = ? WHERE id = ?', [name, introduction, tags, userId]);
            const output = { id: userId };

            //cache
            const userProfileKey = `userProfile:${userId}`;
            const profileCache = await redisClient.get(userProfileKey);
            if (profileCache != null) {
                const user = JSON.parse(profileCache);
                user.name = name;
                user.introduction = introduction;
                user.tags = tags;
                const userProfileJSONString = JSON.stringify(user);
                const expireTimeInSeconds = 10800;
                await redisClient.SETEX(userProfileKey, expireTimeInSeconds, userProfileJSONString, (error) => {
                    if (error) {
                        console.error('更新 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功更新 Redis 快取。');
                    }
                });
            }
            res.status(200).json({
                data: {
                    output
                }
            });
        } catch (error1) {
            error.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    pictureUpdate: async (res, redisClient, userId, filename) => {
        const connection = await module.exports.poolConnection();
        try {

            const baseUrl = 'https://13.55.130.82';
            const pictureUrl = `${baseUrl}/static/${filename}`;
            console.log(`${pictureUrl}!~~`);
            await QUERY('UPDATE users SET picture = ? WHERE id = ?', [pictureUrl, userId]);
            await QUERY('UPDATE posts SET picture = ? WHERE user_id = ?', [pictureUrl, userId]);
            //cache
console.log('update~~');
            const userProfileKey = `userProfile:${userId}`;
            const profileCache = await redisClient.get(userProfileKey);
            if (profileCache != null) {
                const userProfile = JSON.parse(profileCache);
                userProfile.picture = pictureUrl;
                const userProfileJSONString = JSON.stringify(userProfile);

                await redisClient.SETEX(userProfileKey, 10800, userProfileJSONString, (error) => {
                    if (error) {
                        console.error('更新 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功更新 Redis 快取。');
                    }
                });
            }
            const userKey = `user:${userId}`;
            const userCache = await redisClient.get(userKey);
            if (userCache != null) {
                const userDetail = JSON.parse(userCache);
                if (userDetail.posts.length > 0) {
                    for (var i = 0; i < userDetail.posts.length; i++) {
                        userDetail.posts[i].picture = pictureUrl;
                    }
                    const userJSONString = JSON.stringify(userDetail);

                    await redisClient.SETEX(userKey, 10800, userJSONString, (error) => {
                        if (error) {
                            console.error('更新 Redis 快取失敗：', error);
                        } else {
                            console.log('用戶資訊已成功更新 Redis 快取。');
                        }
                    });
                }

            }
            res.status(200).json({
                data:
                {
                    picture: pictureUrl
                }
            });

        } catch (error1) {
            error.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    search: async (res, keyword, userId) => {
        const connection = await module.exports.poolConnection();
        try {
            if (!keyword) return error.input(res);
            const params = [`%${keyword}%`];
            const findUsersResult = await QUERY('SELECT * FROM users WHERE name LIKE ? ', params);
            if (findUsersResult.length == 0) return error.userNotFound(res);
            const searchResult = [];
            for (var i = 0; i < findUsersResult.length; i++) {
                const { id, name, picture } = findUsersResult[i];
                const query = 'SELECT * FROM friendship WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)';
                const search = await QUERY(query, [id, userId, userId, id]);
                let friendship = null;
                if (search.length != 0) {
                    friendship = { id: search[0].id, status: search[0].status };
                }
                const result = {
                    id,
                    name,
                    picture,
                    friendship
                };
                searchResult.push(result)
            }
            res.status(200).json({
                data: {
                    users: searchResult
                }
            });

        } catch (error1) {
            error.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    }

}
