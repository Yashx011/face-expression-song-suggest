const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
        required: true
    },
    mood: {
        type: String,
        required: true
    },
    listenedAt: {
        type: Date,
        default: Date.now
    }
});

historySchema.index({ user: 1, listenedAt: -1 });

const ListeningHistory = mongoose.model("ListeningHistory", historySchema);

module.exports = ListeningHistory;
