const { POOL, QUERY } = require('../database');
const user = require('../Model/user_Model');
const error_message = require('../Others/error');
const tool = require('../Others/tool');

module.exports = {
    getEvents: async(res,userId)=>{
        const connection = await user.poolConnection();
        try {
            const query='SELECT e.id ,e.type,e.is_read,e.image,e.created_at,e.summary FROM event AS e INNER JOIN users AS u ON e.userId = u.id WHERE e.userId = ? ORDER BY e.created_at DESC';
            const checkEventResult =await QUERY(query,[userId]);
            if(checkEventResult.length==0){
                return error_message.cannotRead(res);
            }
            const formattedResults = checkEventResult.map((row) => {
                let {id,type,is_read,image,created_at,summary}=row;
                is_read=!!is_read;
                return {
                    id,
                    type,
                    is_read,
                    image,
                    created_at,
                    summary
                };
            });
            res.status(200).json({
                data: {
                    events: formattedResults
                }
            });
        } catch (error) {
            error_message.query(res);
        }finally{
            console.log('connection release');
            connection.release();
        }
    },
    readEvent: async(res,eid,userId)=>{
        const connection = await user.poolConnection();
        try{
            if(!eid) return error_message.input(res);
            const findEvent = await QUERY('SELECT * FROM event WHERE id = ?', [eid]);
            if(findEvent.length ==0) return error_message.eventNotExist(res);
            if(findEvent[0].userId==userId){
                if(findEvent[0].is_read!=1){
                    const updateRead = await QUERY('UPDATE event SET is_read = ? WHERE id = ?',[true,eid]);
                    res.status(200).json({
                        data: {
                            events: {
                                id: eid
                            }
                        }
                    });
                }
            }else{
                return error_message.cannotRead(res);
            }

            
        } catch (error) {
            error_message.query(res);
        }finally{
            console.log('connection release');
            connection.release();
        }
    }
}
