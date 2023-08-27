const { POOL, QUERY } = require('../database');
const user = require('../Model/user_Model');
const error_message = require('../Others/error');
const tool = require('../Others/tool');
// const redisClient = require('../redisClient');
module.exports = {
    createChat: async (res, message,targetUserId, userId) => {
        const connection = await user.poolConnection();
        try {
            if (!message||!targetUserId) return error_message.input(res);
            const chatResult = await QUERY('INSERT INTO chat (message,senderId,receiverId,created_at) VALUES (?,?,?,?)',[message,userId,targetUserId,tool.getTaiwanDateTime()]);
		const messages = {id: chatResult.insertId};
            res.status(200).json({
                data: {
                    message: messages
                }
            });
        } catch (error) {
            error_message.query(res);
        } finally {
            console.log('connection release');
            connection.release();
        }
    },
getChat: async (res, cursor, targetUserId, userId) => {
        const connection = await user.poolConnection();
        try {
            const limit = 10;
            if (!targetUserId) return error_message.input(res);
            let next_cursor = null;
            let startIndex = 0;
            
            console.log('mess1');
            const totalSortedMessage = await QUERY('SELECT u.id AS uid, u.name AS name,u.picture AS picture,m.id AS mid,m.message AS message,m.created_at AS created_at FROM users AS u INNER JOIN chat AS m ON m.senderId = u.id WHERE (m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?) ORDER BY m.created_at DESC',[userId,targetUserId,targetUserId,userId]);
            if(cursor == undefined){
                startIndex=0;
            }else{
                startIndex = await tool.decryptCursor(cursor);
            }
            if (totalSortedMessage.length-startIndex > limit) {
                next_cursor = await tool.encryptCursor(startIndex+limit);
                next_cursor = encodeURIComponent(next_cursor);
            }
            messageList=totalSortedMessage.slice(startIndex,startIndex+limit);
            console.log('mess2');
            const output =[];
            for(var i =0;i<messageList.length;i++){
                const user ={
                    id: messageList[i].uid,
                    name: messageList[i].name,
                    picture: messageList[i].picture
                };
                const me={
                    id: messageList[i].mid,
                    message: messageList[i].message,
                    created_at: messageList[i].created_at,
                    user
                };
                output.push(me);
            }
            res.status(200).json({
                data: {
                    message: output,
                    next_cursor: next_cursor
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
