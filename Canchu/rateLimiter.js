const { RateLimiterRedis } = require('rate-limiter-flexible');
const redisClient = require('./redisClient');

const RATE_LIMIT = 10; 

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ratelimit',
  points: RATE_LIMIT,
  duration: 1, 
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const rateLimiterRes = await rateLimiter.consume(req.ip);
    res.set('X-RateLimit-Limit', RATE_LIMIT);
    res.set('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
    res.set('X-RateLimit-Reset', new Date(rateLimiterRes.msBeforeNext).toUTCString());

    if (rateLimiterRes.remainingPoints >= 0) {
      // 用戶在限流範圍內，繼續執行下一個中間件或路由處理函式
      next();
    } else {
      // 用戶已超過限流
      res.status(429).send('Too Many Requests');
    }
  } catch (error) {
    // 若有錯誤，進行處理
    console.error('Rate limiter error:', error);
    res.status(429).json({ error: 'Too Many Requests' });
  }
};

module.exports = rateLimiterMiddleware;
