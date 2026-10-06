const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    posterUrl: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    spotifyId: {
        type: String,
        sparse: true
    },
    videoId: {
        type: String,
        sparse: true
    },
    mood: {
        type: String,
        default: "happy"
    }
});

const songModel = mongoose.model("Song", songSchema);
module.exports = songModel;
