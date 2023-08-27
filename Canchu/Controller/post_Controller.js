const post = require('../Model/post_Model');
const error = require('../Others/error');
module.exports = {
    createPost: async(req,res)=>{
        try {
            if (req.headers['content-type'] != 'application/json') return error_message.contentType(res);
            const { context } = req.body;
            const {userId}=req.userData;
            const {redisClient} = req;
            await post.createPost(res,redisClient,context,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    updatePost: async(req,res)=>{
        try{
            if (req.headers['content-type'] != 'application/json') return error_message.contentType(res);
            const pid =parseInt(req.params.id);
            const { context } = req.body;
            const {userId}=req.userData;
            const {redisClient} = req;
            await post.updatePost(res,redisClient,context,pid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    postLike: async (req,res)=>{
        try{
            const pid =parseInt(req.params.id);
            const {userId}=req.userData;
            const {redisClient} = req;
            await post.postLike(res,redisClient,pid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    deleteLike: async(req,res)=>{
        try{
            const pid =parseInt(req.params.id);
            const {userId}=req.userData;
            const {redisClient} = req;
            await post.deleteLike(res,redisClient,pid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    createComment: async(req,res)=>{
        try{
            if (req.headers['content-type'] != 'application/json') return error_message.contentType(res);
            const pid =parseInt(req.params.id);
            const { content } = req.body;
            const {userId}=req.userData;
            const {redisClient} = req;
            await post.createComment(res,redisClient,content,pid,userId);
        }catch (error1) {
            error.dbConnection(res);
        }

    },
    postDetail: async(req,res)=>{
        try{
            const pid =parseInt(req.params.id);
            const {userId}=req.userData;
            const {redisClient} = req;
            await post.postDetail(res,redisClient,pid,userId);
        }catch (error1) {
            error.dbConnection(res);
        }
    },
    findPost: async(req,res)=>{
        try{
            const {userId}=req.userData;
            const { user_id, cursor } = req.query;
            const {redisClient} = req;
            
            await post.findPost(res,redisClient,cursor ? cursor: null ,user_id ? Number(user_id): null,userId);

        }catch (error1) {
            error.dbConnection(res);
        }
    },
    fakePost: async(req,res)=>{
        try{
            await post.fakePost(res);
        }catch (error1) {
            error.dbConnection(res);
        }
    }
}
