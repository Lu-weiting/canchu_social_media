const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const error = require('./error');
const path = require('path');
const CryptoJS = require('crypto-js');
require('dotenv').config();


module.exports = {
  checkEmail: async (email) => {
    const emailRegex = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
    return emailRegex.test(email);
  },
  generateHashSync: async (password) => {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
  },
  generateAccessToken: async (user) => {
    const payload = {
      userId: user.id,
    };
    //   const crypto = require('crypto');
    //   const secretKey = crypto.randomBytes(32).toString('hex');
    const token = jwt.sign(payload, process.env.secret);
    return token;
  },
  confirmPassword: async (input, real) => {
    return bcrypt.compareSync(input, real);
  },
  decodeToken: async (token) => {
    return jwt.verify(token, process.env.secret);
  },
  uploadPicture: () => {
    const storage = multer.diskStorage({
      // /home/ubuntu/my-member-system/students/wei-ting/Canchu/static/
      destination: '/canchu/static',
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
      }
    });
    const upload = multer({ storage: storage });
    return upload;
  },
  encryptCursor: async (cursor) => {
    const encrypted = CryptoJS.AES.encrypt(cursor.toString(), process.env.secret).toString();
    return encrypted;
  },
  decryptCursor: async (encryptedCursor) => {
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedCursor, process.env.secret);
    const decryptedCursor = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return parseInt(decryptedCursor, 10);
  },
  getTaiwanDateTime: ()=>{
    const now = new Date();
    const taiwanOffset = 8 * 60; // 台灣是 UTC+8 時區
    const taiwanTime = new Date(now.getTime() + taiwanOffset * 60 * 1000);
    return taiwanTime.toISOString().slice(0, 19).replace('T', ' '); // 格式化為 'YYYY-MM-DD HH:mm:ss'
  }
  
}
