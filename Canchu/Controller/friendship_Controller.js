const friend = require('../Model/friendship_Model');

const error = require('../Others/error');
const tool = require('../Others/tool');
module.exports = {
    requestFriend: async(req,res)=>{
        try {
            const reqUserId = parseInt(req.params.user_id);
            const {userId} = req.userData;
            const {redisClient} = req;
            await friend.requestFriend(res,redisClient,reqUserId,userId);
            
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    pending: async(req,res)=>{
        try {
            const {userId} = req.userData;
            const {redisClient} = req;
            await friend.pending(res,redisClient,userId);

            
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    friendAgree: async(req,res)=>{
        try {
            const fid = parseInt(req.params.friendship_id);
            const {userId} = req.userData;
            const {redisClient} = req;
            console.log(`agreeCon`);
            await friend.friendAgree(res,redisClient,fid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    friendDelete: async (req,res)=>{
        try {
            const fid = parseInt(req.params.friendship_id);
            const {userId} = req.userData;
            const {redisClient} = req;
console.log('deleteCon~~');
            await friend.friendDelete(res,redisClient,fid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    getFriend: async (req,res)=>{
        try {
            const {userId} = req.userData;
            await friend.getFriend(res,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    }

}
