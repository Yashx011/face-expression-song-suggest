const Redis = require("ioredis");

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,

    // Don't block backend startup while Redis connects
    lazyConnect: true,
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null
});

redis.on("connect", () => {
    console.log("connected to redis");
});

redis.on("error", (error) => {
    console.log("redis error:", error.message);
});

module.exports = redis;