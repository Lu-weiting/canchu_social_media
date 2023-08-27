const { POOL, QUERY } = require('../database');
const user = require('../Model/user_Model');
const error_message = require('../Others/error');
const tool = require('../Others/tool');
// const redisClient = require('../redisClient');
module.exports = {
    createPost: async (res, redisClient, context, userId) => {
        const connection = await user.poolConnection();
        try {
            if (!context) return error_message.input(res);
            const getMyInfo = await QUERY('SELECT name,picture FROM users WHERE id = ?', [userId]);
            const { name, picture } = getMyInfo[0];
            //may remove name picture later
            const createNewPost = await QUERY('INSERT INTO posts (created_at, context, is_liked, like_count, comment_count, picture, name, user_id) VALUES (NOW(),?, ?, ?, ?, ?, ?, ?)', [context, false, 0, 0, picture, name, userId]);
            const postId = { id: createNewPost.insertId };
            const expireTimeInSeconds = 10800;

            const postResult = await QUERY('SELECT * FROM posts WHERE id = ?', [createNewPost.insertId]);
            // may modify (key num)

            const saveInPostRedis = {
                id: postResult[0].id,
                user_id: postResult[0].userId,
                created_at: postResult[0].created_at,
                context: postResult[0].context,
                is_liked: false,
                like_count: postResult[0].like_count,
                comment_count: postResult[0].comment_count,
                picture: postResult[0].picture,
                name: postResult[0].name,
                comments: []
            };
            const saveInUserRedis = {
                id: postResult[0].id,
                user_id: postResult[0].userId,
                created_at: postResult[0].created_at,
                context: postResult[0].context,
                is_liked: false,
                like_count: postResult[0].like_count,
                comment_count: postResult[0].comment_count,
                picture: postResult[0].picture,
                name: postResult[0].name
            };
            // const saveInSearchRedis = {
            //     id: postResult[0].id,
            //     user_id: postResult[0].userId,
            //     created_at: new Date(postResult[0].created_at),
            //     context: postResult[0].context,
            //     is_liked: false,
            //     like_count: postResult[0].like_count,
            //     comment_count: postResult[0].comment_count,
            //     picture: postResult[0].picture,
            //     name: postResult[0].name
            // };

            const postKey = `post:${postResult[0].id}`;
            const postJSONString = JSON.stringify(saveInPostRedis);
            await redisClient.SETEX(postKey, expireTimeInSeconds, postJSONString, (error) => {
                if (error) {
                    console.error('寫入 Redis 快取失敗：', error);
                } else {
                    console.log('用戶資訊已成功寫入 Redis 快取。');
                }
            });
            const userKey = `user:${userId}`;
            const userCache = await redisClient.get(userKey);
            if (userCache != null) {
                const userRedis = JSON.parse(userCache);
                userRedis.posts.push(saveInUserRedis);
                // const friends = userRedis.friends;
                // friends.unshift(userId);
                // for (var i = 0; i < friends.length; i++) {
                //     const searchKey = `${friends[i].id}`;
                //     const searchCache = await redisClient.get(searchKey);
                //     if (searchCache != null) {
                //         const searchObj = JSON.parse(searchCache);
                //         searchObj.posts.unshift(saveInSearchRedis);
                //         const searchJSONString = JSON.stringify(searchObj);
                //         await redisClient.SETEX(searchKey, expireTimeInSeconds, searchJSONString, (error) => {
                //             if (error) {
                //                 console.error('更新 Redis 快取失敗：', error);
                //             } else {
                //                 console.log('用戶資訊已成功更新 Redis 快取。');
                //             }
                //         });
                //     }

                // }
                const userJSONString = JSON.stringify(userRedis);
                await redisClient.SETEX(userKey, expireTimeInSeconds, userJSONString, (error) => {
                    if (error) {
                        console.error('更新 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功更新 Redis 快取。');
                    }
                });
            }

            res.status(200).json({
                data: {
                    post: postId
                }
            });
        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    updatePost: async (res, redisClient, context, pid, userId) => {
        const connection = await user.poolConnection();
        try {
            if (!pid) return error_message.input(res);
            const findPost = await QUERY('SELECT * FROM posts WHERE id = ?', [pid]);
            if (findPost.length == 0) return error_message.postNotExist(res);
            if (findPost[0].user_id != userId) return error_message.cannotUpdatePost(res);
            const updateResult = await QUERY('UPDATE posts SET context = ? WHERE id = ?', [context, pid]);

            //cache
            const postKey = `post:${pid}`;
            const expireTimeInSeconds = 10800;
            const postCache = await redisClient.get(postKey);
            if (postCache != null) {
                const post = JSON.parse(postCache);
                post.context = context;
                const postJSONString = JSON.stringify(post);
                await redisClient.SETEX(postKey, expireTimeInSeconds, postJSONString, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
            }
            const userKey = `user:${userId}`;
            const userCache = await redisClient.get(userKey);
            if (userCache != null) {
                const user = JSON.parse(userCache);
                const userPosts = user.posts;
                const indexToUpdate = userPosts.findIndex(post => post.id == pid);
                if (indexToUpdate != -1) {
                    userPosts[indexToUpdate].context = context;
                    const userJSONString = JSON.stringify(user);
                    await redisClient.SETEX(userKey, expireTimeInSeconds, userJSONString, (error) => {
                        if (error) {
                            console.error('寫入 Redis 快取失敗：', error);
                        } else {
                            console.log('用戶資訊已成功寫入 Redis 快取。');
                        }
                    });
                } else {
                    console.log('user快取更新文章fail。');
                }

            }

            const updatePostKey = `updatePost:${pid}`;
            const updatePost = {
                context: context
            };
            const updatePostJSONString = JSON.stringify(updatePost);
            await redisClient.SETEX(updatePostKey, expireTimeInSeconds, updatePostJSONString, (error) => {
                if (error) {
                    console.error('寫入 Redis 快取失敗：', error);
                } else {
                    console.log('用戶資訊已成功寫入 Redis 快取。');
                }
            });
            const p = { id: pid };
            res.status(200).json({
                data: {
                    post: p
                }
            });
        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    postLike: async (res, redisClient, pid, userId) => {
        const connection = await user.poolConnection();
        try {
            if (!pid) return error_message.input(res);
            const checkLike = await QUERY('SELECT * FROM post_Like WHERE postId = ? AND userId = ?', [pid, userId]);
            if (checkLike.length > 0) return error_message.alreadyLike(res);
            const insertLikeResult = await QUERY('INSERT INTO post_Like (postId, userId) VALUES (?, ?)', [pid, userId]);
            const updatePostLikeCount = await QUERY('UPDATE posts SET like_count = like_count+1 WHERE id = ?', [pid]);

            //cache
            const postKey = `post:${pid}`;
            const expireTimeInSeconds = 10800;
            const postCache = await redisClient.get(postKey);
            if (postCache != null) {
                const post = JSON.parse(postCache);
                post.like_count = post.like_count + 1;
                const postJSONString = JSON.stringify(post);
                await redisClient.SETEX(postKey, expireTimeInSeconds, postJSONString, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
            }

            const likeCountKey = `likeCount:${pid}`;
            const likeCountCache = await redisClient.get(likeCountKey);
            let likeCount = null;
            if (likeCountCache != null) {
                likeCount = JSON.parse(likeCountCache);
                likeCount.add_like.push(userId);
            } else {
                likeCount = {
                    add_like: [],
                    delete_like: []
                };
                likeCount.add_like.push(userId);
            }
            const likeJSONString = JSON.stringify(likeCount);
            await redisClient.SETEX(likeCountKey, expireTimeInSeconds, likeJSONString, (error) => {
                if (error) {
                    console.error('寫入 Redis 快取失敗：', error);
                } else {
                    console.log('用戶資訊已成功寫入 Redis 快取。');
                }
            });

            const p = { id: pid };
            res.status(200).json({
                data: {
                    post: p
                }
            });
        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    deleteLike: async (res, redisClient, pid, userId) => {
        const connection = await user.poolConnection();
        try {
            if (!pid) return error_message.input(res);
            const checkLike = await QUERY('SELECT * FROM post_Like WHERE postId = ? AND userId = ?', [pid, userId]);
            if (checkLike.length == 0) return error_message.cannotDelete(res);
            const updatePostLikeCount = await QUERY('UPDATE posts SET like_count = like_count-1 WHERE id = ?', [pid]);
            const deletePostLike = await QUERY('DELETE FROM post_Like WHERE postId = ? AND userId = ?', [pid, userId]);

            //cache
            const postKey = `post:${pid}`;
            const expireTimeInSeconds = 10800;
            const postCache = await redisClient.get(postKey);
            if (postCache != null) {
                const post = JSON.parse(postCache);
                post.like_count = post.like_count - 1;
                const postJSONString = JSON.stringify(post);
                await redisClient.SETEX(postKey, expireTimeInSeconds, postJSONString, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
            }

            const likeCountKey = `likeCount:${pid}`;
            const likeCountCache = await redisClient.get(likeCountKey);
            let likeCount = null;
            if (likeCountCache != null) {
                likeCount = JSON.parse(likeCountCache);
                likeCount.delete_like.push(userId);
            } else {
                likeCount = {
                    add_like: [],
                    delete_like: []
                };
                likeCount.delete_like.push(userId);
            }
            const likeJSONString = JSON.stringify(likeCount);
            await redisClient.SETEX(likeCountKey, expireTimeInSeconds, likeJSONString, (error) => {
                if (error) {
                    console.error('寫入 Redis 快取失敗：', error);
                } else {
                    console.log('用戶資訊已成功寫入 Redis 快取。');
                }
            });
            const p = { id: pid };
            res.status(200).json({
                data: {
                    post: p
                }
            });
        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    createComment: async (res, redisClient, content, pid, userId) => {
        const connection = await user.poolConnection();
        try {
            if (!pid || !content) return error_message.input(res);
            const checkPost = await QUERY('SELECT * FROM posts WHERE id = ?', [pid]);
            if (checkPost.length == 0) return error_message.postNotExist(res);
            const postComment = await QUERY('INSERT INTO comments (user_id,post_id,comment_text,created_at) VALUES (?,?,?,NOW())', [userId, pid, content]);
            const updatePostCommentCount = await QUERY('UPDATE posts SET comment_count = comment_count+1 WHERE id =?', [pid]);

            // comment cache set
            // cache modify post comment num 
            const expireTimeInSeconds = 10800;
            const postKey = `post:${pid}`;
            const postCache = await redisClient.get(postKey);
            if (postCache != null) {
                const post = JSON.parse(postCache);
                const now = new Date();
                const formattedDateTime = now.toLocaleString('en-US', { timeZone: 'UTC' });
                const userKey = `user:${userId}`;
                const userProfileCache = await redisClient.get(userKey);
                let commenter = [];
                if (userProfileCache != null) {
                    const user = JSON.parse(userProfileCache);
                    const f = {
                        id: user.id,
                        name: user.name,
                        picture: user.picture
                    }
                    commenter.push(f);
                } else {
                    commenter = await QUERY('SELECT id,name,picture FROM users WHERE id= ?', [userId]);
                }
                const user = { id: commenter[0].id, name: commenter[0].name, picture: commenter[0].picture };

                const comment = {
                    id: postComment.insertId,
                    created_at: formattedDateTime,
                    content: content,
                    user
                }
                post.comments.push(comment);
                post.comment_count = post.comment_count + 1;
                const postJSONString = JSON.stringify(post);
                await redisClient.SETEX(postKey, expireTimeInSeconds, postJSONString, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
            }
            const p = { id: pid };
            const c = { id: postComment.insertId };
            res.status(200).json({
                data: {
                    post: p,
                    comment: c
                }
            });

        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    postDetail: async (res, redisClient, pid, userId) => {
        const connection = await user.poolConnection();

        try {
            if (!pid) return error_message.input(res);
            const postKey = `post:${pid}`;
            const postCache = await redisClient.get(postKey);
            const is_like = await QUERY('SELECT * FROM post_Like WHERE postId = ? AND userId = ?', [pid, userId]);

            if (postCache != null) {
                const postInfo = JSON.parse(postCache);
                postInfo.is_liked = is_like.length == 0 ? false : true;
                const output = {
                    id: pid,
                    user_id: postInfo.user_id,
                    created_at: postInfo.created_at,
                    context: postInfo.context,
                    is_liked: is_like.length == 0 ? false : true,
                    like_count: postInfo.like_count,
                    comment_count: postInfo.comment_count,
                    picture: postInfo.picture,
                    name: postInfo.name,
                    comments: postInfo.comments
                }
                res.status(200).json({
                    data: {
                        post: output
                    }
                });
            } else {
                const findPost = await QUERY('SELECT * FROM posts WHERE id = ?', [pid]);
                if (findPost.length == 0) return error_message.postNotExist(res);
                // const like_count = await QUERY('SELECT COUNT(*) FROM post_Like WHERE postId = ?', [pid]);
                //const is_like = await QUERY('SELECT * FROM post_Like WHERE postId = ? AND userId = ?', [pid, userId]);
                const query = 'SELECT c.id AS cid, c.created_at AS created_at ,c.comment_text AS comment, u.id AS uid , u.name AS name, u.picture AS picture FROM comments AS c INNER JOIN users AS u ON c.user_id = u.id WHERE c.post_id = ?';
                const commentDetail = await QUERY(query, [pid]);
                // if (commentDetail.length == 0) return error_message.noComment(res);
                const comments = [];
                for (var i = 0; i < commentDetail.length; i++) {
                    const { cid, created_at, comment, uid, name, picture } = commentDetail[i];
                    const user = { id: uid, name, picture };
                    const result = {
                        id: cid,
                        created_at,
                        content: comment,
                        user
                    }
                    comments.push(result);
                }
                const output = {
                    id: pid,
                    user_id: userId,
                    created_at: findPost[0].created_at,
                    context: findPost[0].context,
                    is_liked: is_like.length == 0 ? false : true,
                    like_count: findPost[0].like_count,
                    comment_count: findPost[0].comment_count,
                    picture: findPost[0].picture,
                    name: findPost[0].name,
                    comments: comments
                }

                // reset again
                const postJSONString = JSON.stringify(output);
                await redisClient.SETEX(postKey, 10800, postJSONString, (error) => {
                    if (error) {
                        console.error('寫入 Redis 快取失敗：', error);
                    } else {
                        console.log('用戶資訊已成功寫入 Redis 快取。');
                    }
                });
                res.status(200).json({
                    data: {
                        post: output
                    }
                });
            }

        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    findPost: async (res, redisClient, cursor, targetUserId, userId) => {
        const connection = await user.poolConnection();
        const limit = 11;
        let decodeCuser =0;
        if(cursor == null){
            decodeCuser=Math.pow(2, 64);
        }else{
            decodeCuser = await tool.decryptCursor(cursor);
        }
        try {
            const query_string = `WITH
                                    post_with_user_data AS (
                                        SELECT P.id, DATE_FORMAT(P.created_at, "%Y-%m-%d %H:%i:%s") AS post_created_at, P.context, U.picture, U.name, U.id AS user_id
                                        FROM posts AS P LEFT JOIN users AS U
                                        ON P.user_id = U.id
                                        WHERE P.user_id in (?) AND P.id < ${decodeCuser}
                                        ORDER BY P.id DESC LIMIT ${limit}
                                    ),
                                    add_comment_count AS (
                                        SELECT B.*, COUNT(C.id) AS comment_count
                                        FROM post_with_user_data AS B LEFT JOIN comments AS C
                                        ON B.id = C.post_id
                                        GROUP BY B.id
                                    ),
                                    add_like_count AS (
                                        SELECT B.*, COUNT(L.postId) AS like_count
                                        FROM add_comment_count AS B LEFT JOIN post_Like AS L
                                        ON B.id = L.postId
                                        GROUP BY B.id
                                    )
                                    SELECT B.*, COUNT(L.postId) AS is_liked
                                    FROM add_like_count AS B LEFT JOIN post_Like AS L
                                    ON B.id = L.postId AND L.userId = ?
                                    GROUP BY B.id
                                    `

            const my_friend_query_string = `SELECT F.senderId AS friend_id
                                                FROM friendship AS F LEFT JOIN users AS U
                                                ON F.senderId = U.id
                                                WHERE status = ? AND receiverId = ?
                                                UNION
                                                SELECT F.receiverId AS friend_id
                                                FROM friendship AS F LEFT JOIN users AS U
                                                ON F.receiverId = U.id
                                                WHERE status = ? AND senderId = ?`

            if (targetUserId) {
                var result = await QUERY(query_string, [targetUserId, userId]);
            } else {
                const user_ids = await QUERY(my_friend_query_string, ['friend', userId, 'friend', userId]);
                var user_id_array = [userId];
                user_ids.forEach(e => user_id_array.push(e.friend_id));

                var result = await QUERY(query_string, [user_id_array, userId]);
            }

            var data = [];
            var len = result.length;
            if (result.length >= limit) len = result.length - 1;

            if (result.length != 0) {
                for (var i = 0; i < len; i++) {
                    const post = {
                        id: result[i].id,
                        user_id: result[i].user_id,
                        created_at: result[i].post_created_at,
                        context: result[i].context,
                        is_liked: result[i].is_liked == 0 ? false : true,
                        like_count: result[i].like_count,
                        comment_count: result[i].comment_count,
                        picture: result[i].picture,
                        name: result[i].name
                    }
                    data.push(post);
                }
            }
            const cusr = String(result[result.length-2].id);
            let next_cursor = await tool.encryptCursor(cusr);
            next_cursor = encodeURIComponent(next_cursor);
            res.status(200).json({data: {
                posts: data,
                next_cursor: result.length < limit ? null : next_cursor
            }});
                    // const limit = 10;
                    // if (targetUserId == undefined) {
                    //     let output = [];
                    //     let posts = [];
                    //     let next_cursor = null;
                    //     let startIndex= 0;
                    //     const checkSearch = await QUERY('SELECT * FROM search WHERE doId = ? LIMIT ?',[userId,1]);
                    //     if(checkSearch.length>0){
                    //         const deleteRecord = await QUERY('DELETE FROM search WHERE doId = ?',[userId]);
                    //     }
                    //     const checkFriendship = await QUERY('SELECT * FROM friendship WHERE (senderId = ? OR receiverId = ?) AND status = ?', [userId, userId, 'friend']);
                    //     if (checkFriendship.length > 0) {
                    //         // may optimize by sql or ... after
                    //         for (var i = 0; i < checkFriendship.length; i++) {
                    //             const { senderId, receiverId } = checkFriendship[i];
                    //             if (userId == senderId) {
                    //                 const friendPosts = await QUERY('SELECT * FROM posts WHERE user_id = ?', [receiverId]);

                    //                 for (var j = 0; j < friendPosts.length; j++) {
                    //                     const checkLike = await QUERY('SELECT * FROM post_Like WHERE postId = ? AND userId = ?', [friendPosts[j].id, userId]);
                    //                     const { id, user_id, created_at, context, like_count, comment_count, picture, name } = friendPosts[j];
                    //                     const insertToTemp = await QUERY('INSERT INTO search (postId,userId,created_at,context,like_count,comment_count,picture,name,doId) VALUES (?,?,?,?,?,?,?,?,?)', [id, user_id, created_at, context, like_count, comment_count, picture, name, userId]);
                    //                     let result = {
                    //                         id: id,
                    //                         user_id: user_id,
                    //                         created_at: created_at,
                    //                         context: context,
                    //                         is_liked: checkLike.length == 0 ? false : true,
                    //                         like_count: like_count,
                    //                         comment_count: comment_count,
                    //                         picture: picture,
                    //                         name: name
                    //                     }
                    //                     posts.push(result);
                    //                 }

                    //             } else {
                    //                 const friendPosts = await QUERY('SELECT * FROM posts WHERE user_id = ?', [senderId]);
                    //                 for (var j = 0; j < friendPosts.length; j++) {
                    //                     const checkLike = await QUERY('SELECT * FROM post_Like WHERE postId = ? AND userId = ?', [friendPosts[j].id, userId]);
                    //                     const { id, user_id, created_at, context, like_count, comment_count, picture, name } = friendPosts[j];
                    //                     const insertToTemp = await QUERY('INSERT INTO search (postId,userId,created_at,context,like_count,comment_count,picture,name,doId) VALUES (?,?,?,?,?,?,?,?,?)', [id, user_id, created_at, context, like_count, comment_count, picture, name, userId]);

                    //                     let result = {
                    //                         id: id,
                    //                         user_id: user_id,
                    //                         created_at: created_at,
                    //                         context: context,
                    //                         is_liked: checkLike.length == 0 ? false : true,
                    //                         like_count: like_count,
                    //                         comment_count: comment_count,
                    //                         picture: picture,
                    //                         name: name
                    //                     }
                    //                     posts.push(result);
                    //                 }
                    //             }
                    //         }
                    //     }
                    //     const checkMyPost = await QUERY('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC', [userId]);
                    //     if (checkMyPost.length > 0) {
                    //         for (var i = 0; i < checkMyPost.length; i++) {
                    //             const checkLike = await QUERY('SELECT * FROM post_Like WHERE postId = ? AND userId = ?', [checkMyPost[i].id, userId]);
                    //             const { id, user_id, created_at, context, like_count, comment_count, picture, name } = checkMyPost[i];
                    //             const insertToTemp = await QUERY('INSERT INTO search (postId,userId,created_at,context,like_count,comment_count,picture,name,doId) VALUES (?,?,?,?,?,?,?,?,?)', [id, user_id, created_at, context, like_count, comment_count, picture, name, userId]);


                    //             let result = {
                    //                 id: id,
                    //                 user_id: user_id,
                    //                 created_at: created_at,
                    //                 context: context,
                    //                 is_liked: checkLike.length == 0 ? false : true,
                    //                 like_count: like_count,
                    //                 comment_count: comment_count,
                    //                 picture: picture,
                    //                 name: name
                    //             }
                    //             posts.push(result);
                    //         }
                    //     }
                    //     if(cursor == undefined){
                    //         startIndex=0;
                    //     }else{
                    //         startIndex = await tool.decryptCursor(cursor);
                    //     }
                    //     if (posts.length-startIndex > limit) {
                    //         next_cursor = await tool.encryptCursor(startIndex+limit);
                    //         next_cursor = encodeURIComponent(next_cursor);
                    //     }
                    //     const result = await QUERY('SELECT * FROM search WHERE doId = ? ORDER BY created_at DESC LIMIT ?,?', [userId, startIndex, limit]);
                    //     for (var i = 0; i < result.length; i++) {
                    //         const checkLike = await QUERY('SELECT * FROM post_Like WHERE postId = ? AND userId = ?', [result[i].postId, userId]);

                    //         const re = {
                    //             id: result[i].postId,
                    //             user_id: result[i].userId,
                    //             created_at: result[i].created_at,
                    //             context: result[i].context,
                    //             is_liked: checkLike.length==0 ? false : true,
                    //             like_count: result[i].like_count,
                    //             comment_count: result[i].comment_count,
                    //             picture: result[i].picture,
                    //             name: result[i].name
                    //         }
                    //         output.push(re);
                    //     }
                    //     res.status(200).json({
                    //         data:{
                    //             posts: output,
                    //             next_cursor: next_cursor
                    //         }
                    //     });

                    // } else {
                    //     const checkUserPost = await QUERY('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC', [targetUserId]);
                    //     let postList = [];
                    //     let startIndex= 0;
                    //     let next_cursor =null;
                    //     if(checkUserPost.length>0){
                    //         for (var i=0;i<checkUserPost.length;i++){
                    //             const checkLike = await QUERY('SELECT * FROM post_Like WHERE postId = ? AND userId = ?', [checkUserPost[i].id, userId]);

                    //             const re = {
                    //                 id: checkUserPost[i].id,
                    //                 user_id: checkUserPost[i].user_id,
                    //                 created_at: checkUserPost[i].created_at,
                    //                 context: checkUserPost[i].context,
                    //                 is_liked: checkLike.length==0 ? false : true,
                    //                 like_count: checkUserPost[i].like_count,
                    //                 comment_count: checkUserPost[i].comment_count,
                    //                 picture: checkUserPost[i].picture,
                    //                 name: checkUserPost[i].name
                    //             }
                    //             postList.push(re);
                    //         }
                    //         if(cursor == undefined){
                    //             startIndex=0;
                    //         }else{
                    //             startIndex = await tool.decryptCursor(cursor);
                    //         }
                    //         if (postList.length-startIndex > limit) {
                    //             next_cursor = await tool.encryptCursor(startIndex+limit);
                    //             next_cursor = encodeURIComponent(next_cursor);
                    //         }
                    //         postList=postList.slice(startIndex,startIndex+limit);
                    //         res.status(200).json({
                    //             data:{
                    //                 posts: postList,
                    //                 next_cursor: next_cursor
                    //             }
                    //         });
                    //     }
                    // }
                } catch (error) {
                    error_message.query(res);
                } finally {
                    console.log('connection release');
                    connection.release();
                }
            },
            fakePost: async (res) => {
                const connection = await user.poolConnection();
                try {
                    const posts = [];
                    for (var i = 1; i <= 5000; i++) {
                        posts.push([`test${i}`, 268]);
                    }
                    await QUERY('INSERT INTO posts (context,user_id) VALUES ?', [posts]);
                    res.status(200).json({
                        finish: 'yes'
                    });
                } catch (error) {
                    console.log(error);
                    error_message.query(res);
                } finally {
                    console.log('connection release');
                    connection.release();
                }
            }

        }
