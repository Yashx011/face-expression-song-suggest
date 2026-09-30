const mongoose = require("mongoose");

const dislikeSchema = new mongoose.Schema(
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

dislikeSchema.index({ user: 1, song: 1 }, { unique: true });

const Dislike = mongoose.model("Dislike", dislikeSchema);

module.exports = Dislike;
