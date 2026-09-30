const mongoose = require("mongoose");

const saveSchema = new mongoose.Schema(
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

saveSchema.index({ user: 1, song: 1 }, { unique: true });

const Save = mongoose.model("Save", saveSchema);

module.exports = Save;
