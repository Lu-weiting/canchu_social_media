const redis = require('redis');
const redisClient = redis.createClient(
// {
//   // legacyMode: true,   // Use the REDIS_HOST environment variable
//   port: process.env.REDIS_PORT || 6379,
//   host: process.env.REDIS_HOST || 'my-redis' 
// }
{
  legacyMode: true,
  url: 'redis://redis:6379'
}
);
redisClient.connect();
redisClient.on('connect', () => {
  console.log('Redis 連線成功');
});

module.exports = redisClient;
