const songModel = require("../models/song.model");
const Like = require("../models/like.model");
const Dislike = require("../models/dislike.model");
const Save = require("../models/save.model");
const ListeningHistory = require("../models/history.model");

// Centralized recommendation scoring weights
const RECOMMENDATION_WEIGHTS = {
    CURRENT_MOOD_MATCH: 50,        // Bonus for matching current requested mood
    USER_PREFERRED_MOOD: 20,       // Bonus for matching user's overall top listened mood
    LIKED_SONG: 30,                // Bonus if song is liked by user
    SAVED_SONG: 20,                // Bonus if song is saved by user
    DISLIKED_SONG: -100,           // Penalty if song is disliked by user
    RECENTLY_PLAYED_PENALTY: -15,  // Penalty for recently played songs to avoid repetition
};

/**
 * Generates personalized song recommendations for a user based on mood & interaction history.
 * @param {string} mood - Current requested mood
 * @param {string|null} userId - User ID if authenticated
 * @param {string|null} excludeId - Song ID to de-prioritize (e.g. current song)
 */
async function getPersonalizedRecommendations(mood, userId = null, excludeId = null) {
    // 1. Fetch all available songs
    const allSongs = await songModel.find({}).lean();
    if (!allSongs || allSongs.length === 0) {
        return { song: null, songs: [] };
    }

    const currentMoodLower = mood ? mood.toLowerCase() : "";

    // 2. Default user interaction sets
    let likedSet = new Set();
    let dislikedSet = new Set();
    let savedSet = new Set();
    let recentHistory = [];
    let userPrimaryMood = null;

    // 3. Fetch user data if authenticated (User Isolation enforced)
    if (userId) {
        const [likes, dislikes, saves, history, moodCounts] = await Promise.all([
            Like.find({ user: userId }).select("song").lean(),
            Dislike.find({ user: userId }).select("song").lean(),
            Save.find({ user: userId }).select("song").lean(),
            ListeningHistory.find({ user: userId }).sort({ listenedAt: -1 }).limit(10).lean(),
            ListeningHistory.aggregate([
                { $match: { user: userId } },
                { $group: { _id: "$mood", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ])
        ]);

        likedSet = new Set(likes.map(l => l.song ? l.song.toString() : "").filter(Boolean));
        dislikedSet = new Set(dislikes.map(d => d.song ? d.song.toString() : "").filter(Boolean));
        savedSet = new Set(saves.map(s => s.song ? s.song.toString() : "").filter(Boolean));
        recentHistory = history.map(h => h.song ? h.song.toString() : "").filter(Boolean);

        if (moodCounts && moodCounts.length > 0 && moodCounts[0]._id) {
            userPrimaryMood = moodCounts[0]._id.toLowerCase();
        }
    }

    // 4. Compute score for each song
    const scoredSongs = allSongs.map(song => {
        const songIdStr = song._id.toString();
        const songMoodLower = (song.mood || "").toLowerCase();
        let score = 0;

        // Current mood match
        if (currentMoodLower && songMoodLower === currentMoodLower) {
            score += RECOMMENDATION_WEIGHTS.CURRENT_MOOD_MATCH;
        }

        // User preferred mood match
        if (userPrimaryMood && songMoodLower === userPrimaryMood) {
            score += RECOMMENDATION_WEIGHTS.USER_PREFERRED_MOOD;
        }

        // Liked song bonus
        if (likedSet.has(songIdStr)) {
            score += RECOMMENDATION_WEIGHTS.LIKED_SONG;
        }

        // Saved song bonus
        if (savedSet.has(songIdStr)) {
            score += RECOMMENDATION_WEIGHTS.SAVED_SONG;
        }

        // Disliked song penalty
        if (dislikedSet.has(songIdStr)) {
            score += RECOMMENDATION_WEIGHTS.DISLIKED_SONG;
        }

        // Recently played repeat penalty
        const recentIndex = recentHistory.indexOf(songIdStr);
        if (recentIndex !== -1) {
            const recencyFactor = (recentHistory.length - recentIndex) / recentHistory.length;
            score += Math.round(RECOMMENDATION_WEIGHTS.RECENTLY_PLAYED_PENALTY * (1 + recencyFactor));
        }

        // De-prioritize excluded song (e.g. currently playing song when skipping)
        if (excludeId && songIdStr === excludeId.toString()) {
            score -= 40;
        }

        return { song, score };
    });

    // 5. Rank songs descending by score
    scoredSongs.sort((a, b) => b.score - a.score);

    // Filter out disliked songs if non-disliked songs are available
    let candidateSongs = scoredSongs.filter(item => !dislikedSet.has(item.song._id.toString()));
    if (candidateSongs.length === 0) {
        candidateSongs = scoredSongs;
    }

    const rankedSongs = candidateSongs.map(item => item.song);
    const topRecommendedSong = rankedSongs.length > 0 ? rankedSongs[0] : null;

    return {
        song: topRecommendedSong,
        songs: rankedSongs
    };
}

module.exports = {
    RECOMMENDATION_WEIGHTS,
    getPersonalizedRecommendations
};
