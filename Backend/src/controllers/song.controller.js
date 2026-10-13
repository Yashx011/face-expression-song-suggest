const mongoose = require("mongoose");
const songModel = require("../models/song.model");
const Like = require("../models/like.model");
const Dislike = require("../models/dislike.model");
const Save = require("../models/save.model");
const ListeningHistory = require("../models/history.model");

/* ───────────────────── LIKE / DISLIKE / SAVE INTERACTIONS ───────────────────── */

async function resolveOrCreateSongId(songId, songData = {}) {
    if (!songId) return null;

    let existing = null;

    if (mongoose.Types.ObjectId.isValid(songId)) {
        existing = await songModel.findById(songId);
    }

    if (!existing) {
        const orConditions = [
            { spotifyId: songId },
            { videoId: songId }
        ];
        if (songData.title) {
            orConditions.push({ title: songData.title });
        }
        existing = await songModel.findOne({ $or: orConditions });
    }

    if (existing) {
        const hasRichData = songData.title || songData.posterUrl || songData.albumImage || songData.artists;
        if (hasRichData) {
            const isDummyTitle = !existing.title || existing.title === songId || existing.title === existing.spotifyId || existing.title === existing.videoId || (existing.title.length > 20 && !existing.title.includes(" "));
            const isPlaceholderPoster = !existing.posterUrl || existing.posterUrl.includes("placeholder");

            if (isDummyTitle || isPlaceholderPoster || (songData.title && songData.title !== existing.title)) {
                if (songData.title) existing.title = songData.title;
                if (songData.posterUrl || songData.albumImage) {
                    existing.posterUrl = songData.posterUrl || songData.albumImage;
                }
                if (songData.youtubeUrl || songData.url) {
                    existing.url = songData.youtubeUrl || songData.url;
                }
                if (songData.spotifyId) existing.spotifyId = songData.spotifyId;
                if (songData.videoId || songData.youtubeId) {
                    existing.videoId = songData.videoId || songData.youtubeId;
                }
                if (songData.artists || songData.mood) {
                    existing.mood = songData.artists || songData.mood;
                }
                await existing.save();
            }
        }
        return existing._id;
    }

    const hasMetadata = songData.title || songData.posterUrl || songData.albumImage;
    if (!hasMetadata && !mongoose.Types.ObjectId.isValid(songId)) {
        return null;
    }

    const title = songData.title || songData.name || songId;
    const posterUrl = songData.posterUrl || songData.albumImage || "https://via.placeholder.com/150";
    const vidId = songData.videoId || songData.youtubeId || (songId.length < 15 ? songId : undefined);
    const spotId = songData.spotifyId || (songId.length > 15 ? songId : undefined);
    const url = songData.youtubeUrl || songData.url || (vidId ? `https://www.youtube.com/watch?v=${vidId}` : `https://www.youtube.com/watch?v=${songId}`);
    const mood = songData.artists || songData.mood || "happy";

    const newSong = await songModel.create({
        title,
        url,
        posterUrl,
        spotifyId: spotId,
        videoId: vidId,
        mood
    });

    return newSong._id;
}

async function toggleLike(req, res) {
    try {
        const { songId } = req.params;
        const userId = req.user._id;

        const mongoSongId = await resolveOrCreateSongId(songId, req.body);
        if (!mongoSongId) {
            return res.status(400).json({ message: "Invalid song ID" });
        }

        const existingLike = await Like.findOne({ user: userId, song: mongoSongId });

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            return res.status(200).json({ isLiked: false, isDisliked: false, message: "Song unliked" });
        } else {
            // Liking removes any existing dislike (mutually exclusive)
            await Dislike.deleteMany({ user: userId, song: mongoSongId });
            await Like.create({ user: userId, song: mongoSongId });
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

        const mongoSongId = await resolveOrCreateSongId(songId, req.body);
        if (!mongoSongId) {
            return res.status(400).json({ message: "Invalid song ID" });
        }

        const existingDislike = await Dislike.findOne({ user: userId, song: mongoSongId });

        if (existingDislike) {
            await Dislike.findByIdAndDelete(existingDislike._id);
            return res.status(200).json({ isDisliked: false, isLiked: false, message: "Dislike removed" });
        } else {
            // Disliking removes any existing like (mutually exclusive)
            await Like.deleteMany({ user: userId, song: mongoSongId });
            await Dislike.create({ user: userId, song: mongoSongId });
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

        const mongoSongId = await resolveOrCreateSongId(songId, req.body);
        if (!mongoSongId) {
            return res.status(400).json({ message: "Invalid song ID" });
        }

        const existingSave = await Save.findOne({ user: userId, song: mongoSongId });

        if (existingSave) {
            await Save.findByIdAndDelete(existingSave._id);
            return res.status(200).json({ isSaved: false, message: "Song unsaved" });
        } else {
            await Save.create({ user: userId, song: mongoSongId });
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

        const mongoSongId = await resolveOrCreateSongId(songId);
        if (!mongoSongId) {
            return res.status(200).json({ isLiked: false, isDisliked: false, isSaved: false });
        }

        const [like, dislike, save] = await Promise.all([
            Like.exists({ user: userId, song: mongoSongId }),
            Dislike.exists({ user: userId, song: mongoSongId }),
            Save.exists({ user: userId, song: mongoSongId })
        ]);

        return res.status(200).json({
            isLiked: Boolean(like),
            isDisliked: Boolean(dislike),
            isSaved: Boolean(save)
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
        const { songId, mood, songData } = req.body;
        const userId = req.user._id;

        if (!songId || !mood) {
            return res.status(400).json({ message: "Song ID and mood are required" });
        }

        let targetSongId = songId;
        if (!mongoose.Types.ObjectId.isValid(targetSongId)) {
            const resolved = await resolveOrCreateSongId(songId, songData || req.body);
            if (resolved) {
                targetSongId = resolved;
            } else {
                return res.status(400).json({ message: "Invalid song ID" });
            }
        }

        const historyItem = await ListeningHistory.create({
            user: userId,
            song: targetSongId,
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