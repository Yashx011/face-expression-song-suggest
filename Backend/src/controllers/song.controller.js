const mongoose = require("mongoose");
const songModel = require("../models/song.model");
const Like = require("../models/like.model");
const Dislike = require("../models/dislike.model");
const Save = require("../models/save.model");
const ListeningHistory = require("../models/history.model");
const NodeID3 = require("node-id3");
const songStorage = require("../services/storage.service");

async function uploadSong(req, res) {
    const songBuffer = req.file.buffer;
    const { mood } = req.body;
    const tags = NodeID3.read(songBuffer);

    const [songFile, posterFile] = await Promise.all([
        songStorage.uploadFile({
            buffer: songBuffer,
            filename: tags.title + ".mp3",
            folder: "songs"
        }),
        songStorage.uploadFile({
            buffer: tags.image.imageBuffer,
            filename: tags.title + ".jpg",
            folder: "posters"
        })
    ]);
    const song = await songModel.create({
        url: songFile.url,
        posterUrl: posterFile.url,
        title: tags.title,
        mood
    });

    return res.status(201).json({
        message: "song uploaded successfully",
        song
    });
}

async function getSong(req, res) {
    try {
        const { mood, exclude } = req.query;
        if (!mood) {
            return res.status(400).json({ message: "Mood is required" });
        }

        const query = { mood: mood.toLowerCase() };
        if (exclude && mongoose.Types.ObjectId.isValid(exclude)) {
            query._id = { $ne: exclude };
        }

        const songs = await songModel.find(query);

        if (!songs || songs.length === 0) {
            return res.status(200).json({
                message: exclude ? "No other song found for this mood" : "No song found for this mood",
                song: null
            });
        }

        const randomIndex = Math.floor(Math.random() * songs.length);
        const song = songs[randomIndex];

        return res.status(200).json({
            message: "song fetched successfully",
            song,
            songs
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to fetch song",
            song: null,
            songs: []
        });
    }
}

/* ───────────────────── LIKE / DISLIKE / SAVE INTERACTIONS ───────────────────── */

async function toggleLike(req, res) {
    try {
        const { songId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(songId)) {
            return res.status(400).json({ message: "Invalid song ID" });
        }

        const existingLike = await Like.findOne({ user: userId, song: songId });

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            return res.status(200).json({ isLiked: false, isDisliked: false, message: "Song unliked" });
        } else {
            // Liking removes any existing dislike (mutually exclusive)
            await Dislike.deleteMany({ user: userId, song: songId });
            await Like.create({ user: userId, song: songId });
            return res.status(201).json({ isLiked: true, isDisliked: false, message: "Song liked" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to toggle like state" });
    }
}

async function toggleDislike(req, res) {
    try {
        const { songId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(songId)) {
            return res.status(400).json({ message: "Invalid song ID" });
        }

        const existingDislike = await Dislike.findOne({ user: userId, song: songId });

        if (existingDislike) {
            await Dislike.findByIdAndDelete(existingDislike._id);
            return res.status(200).json({ isDisliked: false, isLiked: false, message: "Dislike removed" });
        } else {
            // Disliking removes any existing like (mutually exclusive)
            await Like.deleteMany({ user: userId, song: songId });
            await Dislike.create({ user: userId, song: songId });
            return res.status(201).json({ isDisliked: true, isLiked: false, message: "Song disliked" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to toggle dislike state" });
    }
}

async function toggleSave(req, res) {
    try {
        const { songId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(songId)) {
            return res.status(400).json({ message: "Invalid song ID" });
        }

        const existingSave = await Save.findOne({ user: userId, song: songId });

        if (existingSave) {
            await Save.findByIdAndDelete(existingSave._id);
            return res.status(200).json({ isSaved: false, message: "Song unsaved" });
        } else {
            await Save.create({ user: userId, song: songId });
            return res.status(201).json({ isSaved: true, message: "Song saved" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to toggle save state" });
    }
}

async function getInteractionStatus(req, res) {
    try {
        const { songId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(songId)) {
            return res.status(400).json({ message: "Invalid song ID" });
        }

        const [like, dislike, save] = await Promise.all([
            Like.exists({ user: userId, song: songId }),
            Dislike.exists({ user: userId, song: songId }),
            Save.exists({ user: userId, song: songId })
        ]);

        return res.status(200).json({
            isLiked: !!like,
            isDisliked: !!dislike,
            isSaved: !!save
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to fetch interaction status" });
    }
}

async function getLikedSongs(req, res) {
    try {
        const userId = req.user._id;
        const likes = await Like.find({ user: userId }).populate("song").sort({ createdAt: -1 });
        const songs = likes.map(l => l.song).filter(Boolean);
        return res.status(200).json({ songs });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to fetch liked songs" });
    }
}

async function getSavedSongs(req, res) {
    try {
        const userId = req.user._id;
        const saves = await Save.find({ user: userId }).populate("song").sort({ createdAt: -1 });
        const songs = saves.map(s => s.song).filter(Boolean);
        return res.status(200).json({ songs });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to fetch saved songs" });
    }
}

/* ───────────────────── LISTENING HISTORY ───────────────────── */

async function recordHistory(req, res) {
    try {
        const { songId, mood } = req.body;
        const userId = req.user._id;

        if (!songId || !mood) {
            return res.status(400).json({ message: "Song ID and mood are required" });
        }

        if (!mongoose.Types.ObjectId.isValid(songId)) {
            return res.status(400).json({ message: "Invalid song ID" });
        }

        const historyItem = await ListeningHistory.create({
            user: userId,
            song: songId,
            mood: mood.toLowerCase()
        });

        return res.status(201).json({ message: "History recorded", historyItem });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to record listening history" });
    }
}

async function getHistory(req, res) {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 50;

        const history = await ListeningHistory.find({ user: userId })
            .populate("song")
            .sort({ listenedAt: -1 })
            .limit(limit);

        return res.status(200).json({ history });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to fetch listening history" });
    }
}

/* ───────────────────── MOOD ANALYTICS ───────────────────── */

async function getAnalytics(req, res) {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);

        const totalListened = await ListeningHistory.countDocuments({ user: userId });
        const totalLiked = await Like.countDocuments({ user: userId });

        const moodCounts = await ListeningHistory.aggregate([
            { $match: { user: userId } },
            { $group: { _id: "$mood", count: { $sum: 1 } } }
        ]);

        const moodBreakdown = {
            happy: 0,
            sad: 0,
            neutral: 0,
            surprised: 0
        };

        let maxCount = 0;
        let mostListenedMood = null;

        moodCounts.forEach(item => {
            const m = item._id ? item._id.toLowerCase() : "neutral";
            moodBreakdown[m] = item.count;
            if (item.count > maxCount) {
                maxCount = item.count;
                mostListenedMood = m;
            }
        });

        const recentHistory = await ListeningHistory.find({ user: userId })
            .populate("song")
            .sort({ listenedAt: -1 })
            .limit(5);

        return res.status(200).json({
            totalListened,
            totalLiked,
            mostListenedMood,
            moodBreakdown,
            recentSongs: recentHistory
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to calculate analytics" });
    }
}

/* ───────────────────── USER PREFERENCES ───────────────────── */

async function getUserPreferences(req, res) {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);

        const [likedCount, dislikedCount, savedCount, historyCount, topMoods, recentHistory, likedSongs] = await Promise.all([
            Like.countDocuments({ user: userId }),
            Dislike.countDocuments({ user: userId }),
            Save.countDocuments({ user: userId }),
            ListeningHistory.countDocuments({ user: userId }),
            ListeningHistory.aggregate([
                { $match: { user: userId } },
                { $group: { _id: "$mood", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            ListeningHistory.find({ user: userId }).populate("song", "title posterUrl mood url").sort({ listenedAt: -1 }).limit(5).lean(),
            Like.find({ user: userId }).populate("song", "title posterUrl mood url").sort({ createdAt: -1 }).limit(5).lean()
        ]);

        const preferredMoods = topMoods.map(item => ({
            mood: item._id,
            count: item.count,
            percentage: historyCount > 0 ? Math.round((item.count / historyCount) * 100) : 0
        }));

        const primaryMood = preferredMoods.length > 0 ? preferredMoods[0].mood : "None";

        return res.status(200).json({
            stats: {
                totalLiked: likedCount,
                totalDisliked: dislikedCount,
                totalSaved: savedCount,
                totalListened: historyCount,
                primaryMood
            },
            preferredMoods,
            recentTracks: recentHistory.map(h => h.song).filter(Boolean),
            favoriteTracks: likedSongs.map(l => l.song).filter(Boolean)
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to calculate user preferences" });
    }
}

module.exports = {
    uploadSong,
    getSong,
    toggleLike,
    toggleDislike,
    toggleSave,
    getInteractionStatus,
    getLikedSongs,
    getSavedSongs,
    recordHistory,
    getHistory,
    getAnalytics,
    getUserPreferences
};