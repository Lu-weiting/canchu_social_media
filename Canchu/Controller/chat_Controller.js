const chat = require('../Model/chat_Model');
const error = require('../Others/error');

module.exports = {
    createChat: async (req, res) => {
        try {
            if (req.headers['content-type'] != 'application/json') return error_message.contentType(res);
            const { message } = req.body;
            const uid =parseInt(req.params.user_id);
            const {userId}=req.userData;
            
            await chat.createChat(res,message,uid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
getChat: async (req, res) => {
        try {
            const uid =parseInt(req.params.user_id);
            const { cursor } = req.query;
            const {userId}=req.userData;
            
            await chat.getChat(res,cursor,uid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    }
}
