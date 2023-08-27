const { POOL, QUERY } = require('../database');
const user = require('../Model/user_Model');
const error = require('../Others/error');
const tool = require('../Others/tool');
// const redisClient = require('../redisClient');

module.exports = {
    getFriend: async (res, userId) => {
        const connection = await user.poolConnection();
        try {
            const allFriendship = await QUERY('SELECT * FROM friendship WHERE (senderId = ? OR receiverId = ?) AND status = ?', [userId, userId, 'friend']);
            const friendListResult = [];
            for (var i = 0; i < allFriendship.length; i++) {
                const { id, status, senderId, receiverId } = allFriendship[i];
                const friendship = { id: id, status };
                if (userId == senderId) {
                    const receiverData = await QUERY('SELECT id,name,picture FROM users WHERE id = ?', [receiverId]);
                    const result = {
                        id: receiverData[0].id,
                        name: receiverData[0].name,
                        picture: receiverData[0].picture,
                        friendship
                    }
                    friendListResult.push(result);
                } else {
                    const senderData = await QUERY('SELECT id,name,picture FROM users WHERE id = ?', [senderId]);
                    const result = {
                        id: senderData[0].id,
                        name: senderData[0].name,
                        picture: senderData[0].picture,
                        friendship
                    }
                    friendListResult.push(result);
                }
            }
            res.status(200).json({
                data: {
                    users: friendListResult
                }
            });


        } catch (error1) {
            error.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    // 還沒判斷到當使用者處於被邀請的狀態又發起邀請回同一個使用者
    requestFriend: async (res, redisClient, reqUserId, userId) => {
        const connection = await user.poolConnection();
        try {
            if (!reqUserId) return error.input(res);
            const checkUser = await QUERY('SELECT * FROM users WHERE id = ?', [reqUserId]);
            if (checkUser.length == 0) {
                return error.userNotFound(res);
            }
            if (reqUserId == userId) {
                return error.noFriendRequestYourself(res);
            }
            const checkFriendship = await QUERY('SELECT * FROM friendship WHERE senderId = ? AND receiverId = ?', [userId, reqUserId]);
            if (checkFriendship.length > 0) {
                return error.requestBetweenExist(res);
            }
            const sender = await QUERY('SELECT * FROM users WHERE id = ?', [userId]);
            let message = `${sender[0].name} invited you to be friends`;
            const insertEventResult = await QUERY('INSERT INTO event (type, image, summary, is_read, created_at, userId ) VALUES (?, ?, ?, ?, NOW(), ?)', ['friend_request', sender[0].picture, message, false, reqUserId]);
            const insertFriendshipResult = await QUERY('INSERT INTO friendship (status, senderId, receiverId) VALUES (?, ?, ?)', ['requested', userId, reqUserId]);
            const friendshipId = insertFriendshipResult.insertId;
            const friendship = { id: friendshipId };
            const friendKey = `friend:${userId}&${reqUserId}`;
            const saveInfriendCache = {
                id: friendshipId,
                status: 'requested'
            };
            const friendKey2 = `friend:${reqUserId}&${userId}`;
            const saveInfriendCache2 = {
                id: friendshipId,
                status: 'requested'
            };

            const friendJSON = JSON.stringify(saveInfriendCache);
            await redisClient.SETEX(friendKey, 10800, friendJSON, (error) => {
                if (error) {
                    console.error('寫入 Redis 快取失敗：', error);
                } else {
                    console.log('用戶資訊已成功寫入 Redis 快取。');
                }
            });
            const friendJSON2 = JSON.stringify(saveInfriendCache2);
            await redisClient.SETEX(friendKey2, 10800, friendJSON2, (error) => {
                if (error) {
                    console.error('寫入 Redis 快取失敗：', error);
                } else {
                    console.log('用戶資訊已成功寫入 Redis 快取。');
                }
            });
            res.status(200).json({
                data: {
                    friendship
                }
            });

        } catch (error1) {
            error.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    pending: async (res, redisClient, userId) => {
        const connection = await user.poolConnection();
        try {
            const query = 'SELECT u.id AS uid, u.name, u.picture, f.id AS fid, f.status FROM users AS u INNER JOIN friendship AS f ON u.id = f.senderId WHERE f.receiverId = ? AND f.status = ?';
            const selectResult = await QUERY(query, [userId, 'requested']);
            if (selectResult.length == 0) return error.noPendingFriendship(res);
            let data = [];
            for (var i = 0; i < selectResult.length; i++) {
                const { uid, name, picture, fid, status } = selectResult[i];
                const updateResult = await QUERY('UPDATE friendship SET status = ? WHERE id = ?', ['pending', fid])
                const result = {
                    uid,
                    name,
                    picture,
                    friendship: { id: fid, status: 'pending' }
                };
                const friendKey = `friend:${uid}&${userId}`;
                const saveInfriendCache = {
                    id: fid,
                    status: 'pending'
                };
                const friendKey2 = `friend:${userId}&${uid}`;
                const saveInfriendCache2 = {
                    id: fid,
                    status: 'pending'
                };
                const friendJSON = JSON.stringify(saveInfriendCache);
                await redisClient.SETEX(friendKey, 10800, friendJSON, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
                const friendJSON2 = JSON.stringify(saveInfriendCache2);
                await redisClient.SETEX(friendKey2, 10800, friendJSON2, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
                data.push(result);
            }

            res.status(200).json({
                data: {
                    users: data
                }
            });

        } catch (error1) {
            error.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    friendAgree: async (res, redisClient,fid, userId) => {
        const connection = await user.poolConnection();
        try {
            console.log(`${fid},${userId}`);
            if (!fid) return error.input(res);
            const findFriendshipResult = await QUERY('SELECT * FROM friendship WHERE id = ? AND receiverId = ?', [fid, userId]);
            if (findFriendshipResult.length == 0) {
                return error.friendshipNotExist(res);
            } else {
                const { status } = findFriendshipResult[0];
                if (status == 'friend') return error.isAlreadyFriend(res);
                const { senderId } = findFriendshipResult[0];
                console.log(`${fid},${userId},${senderId}`);
                const updateStatusResult = await QUERY('UPDATE friendship SET status = ? WHERE id = ?', ['friend', fid]);
                const updateMyFriendCount = await QUERY('UPDATE users SET friend_count = friend_count + 1 WHERE id = ?'
                    , [userId]);
                const updateSenderFriendCount = await QUERY('UPDATE users SET friend_count = friend_count + 1 WHERE id = ?'
                    , [senderId]);
                const getMyInfo = await QUERY('SELECT name,picture FROM users WHERE id = ?', [userId]);
                let message = `${getMyInfo[0].name} has accepted your friend request.`;
                const insertEventToSender = await QUERY('INSERT INTO event (type, image, summary, is_read, created_at, userId ) VALUES (?, ?, ?, ?, NOW(), ?)', ['friend_request', getMyInfo[0].picture, message, false, senderId]);
                const friendship = { id: fid };



                const friendKey = `friend:${senderId}&${userId}`;
                const saveInfriendCache = {
                    id: fid,
                    status: 'friend'
                };
                const friendKey2 = `friend:${userId}&${senderId}`;
                const saveInfriendCache2 = {
                    id: fid,
                    status: 'friend'
                };
                const friendJSON = JSON.stringify(saveInfriendCache);
                await redisClient.SETEX(friendKey, 10800, friendJSON, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
                const friendJSON2 = JSON.stringify(saveInfriendCache2);
                await redisClient.SETEX(friendKey2, 10800, friendJSON2, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
            
                const thisUserKey = `user:${userId}`;
                const thisUserCache = await redisClient.get(thisUserKey);
                if (thisUserCache != null) {
                    const thisUserObj = JSON.parse(thisUserCache);
                    thisUserObj.friends.push(senderId);
                    const thisUserJSON = JSON.stringify(thisUserObj);
                    await redisClient.SETEX(thisUserKey, 10800, thisUserJSON, (error) => {
                        if (error) {
                            console.error('寫入 Redis 快取失敗：', error);
                        } else {
                            console.log('用戶資訊已成功寫入 Redis 快取。');
                        }
                    });
                }

                const senderUserKey = `user:${senderId}`;
                const senderUserCache = await redisClient.get(senderUserKey);
                if (senderUserCache != null) {
                    const senderUserObj = JSON.parse(senderUserCache);
                    senderUserObj.friends.push(userId);
                    const senderUserJSON = JSON.stringify(senderUserObj);
                    await redisClient.SETEX(senderUserKey, 10800, senderUserJSON, (error) => {
                        if (error) {
                            console.error('寫入 Redis 快取失敗：', error);
                        } else {
                            console.log('用戶資訊已成功寫入 Redis 快取。');
                        }
                    });
                }
                res.status(200).json({
                    data: {
                        friendship
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
    friendDelete: async (res, redisClient,fid, userId) => {
        const connection = await user.poolConnection();
        try {
            if (!fid) return error.input(res);
            const selectFriendshipResult = await QUERY('SELECT * FROM friendship WHERE id = ?', [fid]);
            if (selectFriendshipResult.length == 0) return error.friendshipNotExist(res);
            const { status, senderId, receiverId } = selectFriendshipResult[0];
            if (senderId != userId && receiverId != userId) return error.cannotDelete(res);
            const deleteResult = await QUERY('DELETE FROM friendship WHERE id = ?', [fid]);
            if (status == 'friend') {
                const updateMyFriendCount = await QUERY('UPDATE users SET friend_count = friend_count -1 WHERE id = ?', [senderId]);
                const updateTargetFriendCount = await QUERY('UPDATE users SET friend_count = friend_count -1 WHERE id = ?', [receiverId]);
            }
            const friendKey = `friend:${senderId}&${receiverId}`;
            await redisClient.del(friendKey);
            // const saveInfriendCache = {
            //     id: fid,
            //     status: 'delete'
            // };
            

           const friendKey2 = `friend:${receiverId}&${senderId}`;
           await redisClient.del(friendKey2);
            

            const thisUserKey = `user:${receiverId}`;
                const thisUserCache = await redisClient.get(thisUserKey);
                if (thisUserCache != null) {
                    const thisUserObj = JSON.parse(thisUserCache);
                    const indexToUpdate = thisUserObj.friends.findIndex(id => id == senderId);
                    if (indexToUpdate != -1) {
                        thisUserObj.friends.splice(indexToUpdate, 1);
                    }
                    const thisUserJSON = JSON.stringify(thisUserObj);
                    await redisClient.SETEX(thisUserKey, 10800, thisUserJSON, (error) => {
                        if (error) {
                            console.error('寫入 Redis 快取失敗：', error);
                        } else {
                            console.log('用戶資訊已成功寫入 Redis 快取。');
                        }
                    });
                }

                const senderUserKey = `user:${senderId}`;
                const senderUserCache = await redisClient.get(senderUserKey);
                if (senderUserCache != null) {
                    const senderUserObj = JSON.parse(senderUserCache);
                    const indexToUpdate = senderUserObj.friends.findIndex(id => id == receiverIdId);
                    if (indexToUpdate != -1) {
                        senderUserObj.friends.splice(indexToUpdate, 1);
                    }
                    const senderUserJSON = JSON.stringify(senderUserObj);
                    await redisClient.SETEX(senderUserKey, 10800, senderUserJSON, (error) => {
                        if (error) {
                            console.error('寫入 Redis 快取失敗：', error);
                        } else {
                            console.log('用戶資訊已成功寫入 Redis 快取。');
                        }
                    });
                }

            const friendship = { id: fid };
            res.status(200).json({
                data: {
                    friendship
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
