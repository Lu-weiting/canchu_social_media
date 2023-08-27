const { POOL, QUERY } = require('../database');
const user = require('../Model/user_Model');
const error_message = require('../Others/error');
const tool = require('../Others/tool');
module.exports = {
    createGroup: async (res,name,userId)=>{
        const connection = await user.poolConnection();
        try {
            if (!name) return error_message.input(res);
            const checkGroup = await QUERY('SELECT * FROM `group` WHERE name = ?',[name]);
            if(checkGroup.length > 0 )return error_message.groupNameHasExist(res);
            const createResult = await QUERY('INSERT INTO `group` (name, founderId, count) VALUES (? , ? , ?)',[name,userId,1]);
            const addGroupDetail =await QUERY('INSERT INTO group_detail (groupId,userId,status) VALUES (? , ? , ?)',[createResult.insertId,userId,'founder']);
            const groupId = { id: createResult.insertId };
            res.status(200).json({
                data: {
                    group: groupId
                }
            });

        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    deleteGroup: async (res,gid,userId)=>{
        const connection = await user.poolConnection();
        try {
            if (!gid) return error_message.input(res);
            const checkGroup = await QUERY('SELECT * FROM `group` WHERE id = ?',[gid]);
            if(checkGroup.length == 0 )return error_message.cannotDeleteGroup(res);
            if(userId!=checkGroup[0].founderId) return error_message.cannotDeleteGroup(res);
            const deleteEachUserResult = await QUERY('DELETE FROM group_detail WHERE groupId = ?',[gid]);
            console.log('here2');
            const deleteResult = await QUERY('DELETE FROM `group` WHERE id = ?',[gid]);
            console.log('here1');
            const groupId = { id: gid };
            res.status(200).json({
                data: {
                    group: groupId
                }
            });
        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
    joinGroup: async (res,gid,userId)=>{
        const connection = await user.poolConnection();
        try {
            if (!gid) return error_message.input(res);
            const checkGroup = await QUERY('SELECT * FROM `group` WHERE id = ?',[gid]);
            if(checkGroup.length == 0 )return error_message.cannotJoin(res);
            if(userId== checkGroup[0].founderId) return error_message.cannotJoin(res);
            const checkJoiner = await QUERY('SELECT * FROM group_detail WHERE groupId = ? AND userId = ?',[gid,userId]);
            if(checkJoiner.length >0) return error_message.cannotJoin(res);
            const addGroupDetail =await QUERY('INSERT INTO group_detail (groupId,userId,status) VALUES (? , ? , ?)',[gid,userId,'requested']);
            // const updateGroupCount = await QUERY('UPDATE `group` SET count = count+1 WHERE id = ?',[gid]);
            const groupId = { id: gid };
            res.status(200).json({
                data: {
                    group: groupId
                }
            });
        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        } 

    },
    pending: async(res,gid,userId)=>{
        const connection = await user.poolConnection();
        try {
            if (!gid) return error_message.input(res);
            const checkGroup = await QUERY('SELECT * FROM `group` WHERE id = ?',[gid]);
            if(checkGroup.length == 0 )return error_message.groupNotExist(res);
            if(userId!=checkGroup[0].founderId) return error_message.cannotPending(res);
            const updateGroupDetailStatus = await QUERY('UPDATE group_detail SET status = ? WHERE groupId = ? AND status = ?',['pending',gid,'requested']);
            const output = await QUERY('SELECT u.id AS uid, u.name AS name ,u.picture AS picture ,g.status AS status FROM users AS u INNER JOIN group_detail AS g ON u.id = g.userId WHERE g.status = ? AND g.group_id = ?',['pending',gid]);
            const result =[];
            for (var i =0;i<output.length;i++){
                const {uid,name,picture,status}=output[i];
                const info = {
                    id: uid,
                    name,
                    picture,
                    status
                };
                result.push(info);
            }
            res.status(200).json({
                data: {
                    users: result
                }
            });
        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        } 
    },
    agree:async(res,gid,targetUserId,userId)=>{
        const connection = await user.poolConnection();
        try {
            if (!gid||!targetUserId) return error_message.input(res);
            const checkGroup = await QUERY('SELECT * FROM `group` WHERE id = ?',[gid]);
            if(checkGroup.length == 0 )return error_message.groupNotExist(res);
            if(userId!=checkGroup[0].founderId) return error_message.cannotPending(res);
            const checkRequest = await QUERY('SELECT * FROM group_detail WHERE userId = ? AND groupId = ?',[targetUserId,gid]);
            if(checkRequest.length==0) return error_message.cannotAgree(res);
            if(checkRequest[0].status == 'member') return error_message.alreadyMember(res);
            const updateGroupCount = await QUERY('UPDATE `group` SET count = count+1 WHERE id = ?',[gid]);
            const updateGroupDetail = await QUERY('UPDATE group_detail SET status = ? WHERE userId = ? AND groupId = ?',['member',targetUserId,gid]);
            const groupId = { id: gid };
            res.status(200).json({
                data: {
                    group: groupId
                }
            });

        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        } 
    },
    post:async(res,context,gid,userId)=>{
        const connection = await user.poolConnection();
        try {
            if (!gid) return error_message.input(res);
            const checkGroup = await QUERY('SELECT * FROM `group` WHERE id = ?',[gid]);
            if(checkGroup.length == 0 )return error_message.groupNotExist(res);
            console.log('checkPostRight');
            const checkPostRight = await QUERY('SELECT u.name AS name,u.picture AS picture FROM users AS u INNER JOIN group_detail AS g ON g.userId = u.id WHERE g.groupId = ? AND g.userId = ? AND g.status = ?',[gid,userId,'member']);
            if(checkPostRight.length ==0) return error_message.cannotPending(res);
            console.log('createpost');
            const {name,picture} = checkPostRight[0];
console.log(tool.getTaiwanDateTime());
            const createPost = await QUERY('INSERT INTO group_post (context,created_at,posterId,groupId,like_count,comment_count,picture,name) VALUES (?,?,?,?,?,?,?,?)',[context,tool.getTaiwanDateTime(),userId,gid,0,0,picture,name]);                        
            const groupId = { id: gid };
            const user = { id: userId };
            const postId = { id: createPost.insertId };
            res.status(200).json({
                data: {
                    group: groupId,
                    user: user,
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
getPost:async(res,gid,userId)=>{
        const connection = await user.poolConnection();
        try {
            if (!gid) return error_message.input(res);
            const checkGroup = await QUERY('SELECT * FROM `group` WHERE id = ?',[gid]);
            if(checkGroup.length == 0 )return error_message.groupNotExist(res);
            const checkRight = await QUERY('SELECT * FROM group_detail WHERE status = ? AND userId = ? AND groupId = ?',['member',userId,gid]);
            if(checkRight.length ==0) return error_message.cannotPending(res);
            const getPosts = await QUERY('SELECT * FROM group_post WHERE groupId = ? ORDER BY created_at DESC',[gid]);
            const output = [];
            for(var i=0;i<getPosts.length;i++){
                const re={
                    id: getPosts[i].id,
                    user_id: getPosts[i].posterId,
                    created_at: getPosts[i].created_at,
                    context: getPosts[i].context,
                    is_liked: false,
                    like_count: 0,
                    comment_count: 0,
                    picture: getPosts[i].picture,
                    name: getPosts[i].name
                };
                output.push(re);
            };
            res.status(200).json({
                data: {
                    posts: output
                }
            });
        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        } 
    }




}
