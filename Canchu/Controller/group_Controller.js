const group = require('../Model/group_Model');
const error = require('../Others/error');
const tool = require('../Others/tool');
module.exports = {
    createGroup: async(req,res)=>{
        try {
            if (req.headers['content-type'] != 'application/json') return error.contentType(res);
            const { name } = req.body;
            const { userId } = req.userData;
            await group.createGroup(res,name,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    deleteGroup: async(req,res)=>{
        try {
            // if (req.headers['content-type'] != 'application/json') return error.contentType(res);
            const gid =parseInt(req.params.group_id);
            const { userId } = req.userData;
            await group.deleteGroup(res,gid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    joinGroup: async(req,res)=>{
        try {
            // if (req.headers['content-type'] != 'application/json') return error.contentType(res);
            const gid =parseInt(req.params.group_id);
            const { userId } = req.userData;
            await group.joinGroup(res,gid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    pending: async(req,res)=>{
        try {
            // if (req.headers['content-type'] != 'application/json') return error.contentType(res);
            const gid =parseInt(req.params.group_id);
            const { userId } = req.userData;
            await group.pending(res,gid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
agree: async(req,res)=>{
        try {
            // if (req.headers['content-type'] != 'application/json') return error.contentType(res);
            const gid =parseInt(req.params.group_id);
            const uid =parseInt(req.params.user_id);
            const { userId } = req.userData;
            await group.agree(res,gid,uid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
post: async(req,res)=>{
        try {
            if (req.headers['content-type'] != 'application/json') return error.contentType(res);
            const gid =parseInt(req.params.group_id);
            const { context } = req.body;
            const { userId } = req.userData;
            await group.post(res,context,gid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
getPost: async(req,res)=>{
        try {
            // if (req.headers['content-type'] != 'application/json') return error.contentType(res);
            const gid =parseInt(req.params.group_id);
            const { userId } = req.userData;
            await group.getPost(res,gid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    }
}
