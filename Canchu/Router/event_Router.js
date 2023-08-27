const express = require('express');
const router = express.Router();
const user_Controller = require('../Controller/user_Controller');
const event_Controller = require('../Controller/event_Controller');
router.get('/', user_Controller.authorization, event_Controller.getEvents);
router.post('/:event_id/read',user_Controller.authorization,event_Controller.readEvent);


module.exports = router;
