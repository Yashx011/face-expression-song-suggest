const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },
        song: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Song",
            required: true
        }
    },
    { timestamps: true }
);

// Prevent duplicate likes for the same user and song
likeSchema.index({ user: 1, song: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;
