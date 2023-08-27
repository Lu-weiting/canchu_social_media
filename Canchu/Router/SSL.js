const express = require('express');
const router = express.Router();
const path =require('path');

router.get('/.well-known/pki-validation/FF72A581495D8388209D46DF02D84AF7.txt',(req,res)=>{
    const file= path.join(__dirname,'..','public','FF72A581495D8388209D46DF02D84AF7.txt');
    res.sendFile(file);
});


module.exports = router;
