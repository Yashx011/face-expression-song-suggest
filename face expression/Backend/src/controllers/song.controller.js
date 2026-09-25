const songModel = require("../models/song.model")
const NodeID3 = require("node-id3")
const songStorage = require("../services/storage.service")

async function uploadSong(req,res){
    const songBuffer = req.file.buffer
    const {mood} = req.body
    const tags = NodeID3.read(songBuffer)
  
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
    ])
    const song = await songModel.create({
        url:songFile.url,
        posterUrl:posterFile.url,
        title:tags.title,
        mood
    })
   
    return res.status(201).json({
        message:"song uploaded successfully",
        song
    })

}

async function getSong(req,res){
    const {mood} = req.query
    const song = await songModel.findOne({
        mood
    })
    return res.status(200).json({
        message:"song fetched successfully",
        song
    })
}

module.exports = {
    uploadSong,
    getSong
}