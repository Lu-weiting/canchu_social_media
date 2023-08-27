const event = require('../Model/event_Model');
const error = require('../Others/error');
const tool = require('../Others/tool');
module.exports = {
    getEvents: async(req,res)=>{
        try {
            const {userId} = req.userData;
            await event.getEvents(res,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    readEvent: async(req,res)=>{
        try {
            const eid =parseInt(req.params.event_id);
            const {userId} = req.userData;
            await event.readEvent(res,eid,userId);
        } catch (error1) {
            error.dbConnection(res);
        }
    }
}
