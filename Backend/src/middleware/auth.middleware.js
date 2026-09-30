const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const blackListModel = require("../models/blackList.model")
const redis = require("../config/cache")



async function authUser(req, res, next) {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({ message: "token not provided" })
    }
    const blackListedToken = await redis.get(token)
    if (blackListedToken) {
        return res.status(401).json({ message: "invalid token" })
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ message: "invalid token" })
    }

}

async function authUserOptional(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        req.user = null;
        return next();
    }
    try {
        const blackListedToken = await redis.get(token);
        if (blackListedToken) {
            req.user = null;
            return next();
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedToken;
        next();
    } catch (error) {
        req.user = null;
        return next();
    }
}

module.exports = {
    authUser,
    authUserOptional
};