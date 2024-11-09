require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const User = require("./models/user.model");
const Note = require("./models/note.model");

const express = require("express");
const cors = require("cors");
const app = express();

const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./utilities');

app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);

app.get("/", (req, res) => {
    res.json({ data: "hello" });
});

// Create account
app.post("/create-account", async (req, res) => {

    const { fullName, email, password } = req.body;

    if (!fullName) {
        return res
            .status(400)
            .json({ error: true, message: "Name is required" });
    }

    if (!email) {
        return res
            .status(400)
            .json({ error: true, message: "email is required" });
    }

    if (!password) {
        return res
            .status(400)
            .json({ error: true, message: "password is required" });
    }

    const isUser = await User.findOne({ email: email });

    if (isUser) {
        return res.json({
            error: true,
            message: "User already exists",
        })
    }

    const user = new User({
        fullName,
        email,
        password,
    });

    await user.save();

    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "36000m",
    });

    return res.json({
        error: false,
        user,
        accessToken,
        message: "Registration Successful",
    });
});

//login
app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ message: "email is required" });
    }

    if (!password) {
        return res.status(400).json({ message: "password is required" });
    }

    const userInfo = await User.findOne({ email: email });

    if (!userInfo) {
        return res.status(400).json({ message: "user not found" });
    }

    if (userInfo.email == email && userInfo.password == password) {
        const user = { user: userInfo };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "36000m",
        });

        return res.json({
            error: false,
            message: "login successful",
            email,
            accessToken,
        });
    } else {
        return res.json({
            error: true,
            message: "Invalid Credentials",
        })
    }
});

//getuser
app.get("/get-user", authenticateToken, async(req, res)=>{
    const {user} = req.user;
    const isUser = await User.findOne({_id: user._id});

    if(!isUser){
        return res.sendStatus(401);
    }

    return res.json({
        user: {_id:user._id, fullName:user.fullName, email:user.email, password:user.password, createdOn:user.createdOn},
        message:"",
    });
});

//add notes 
app.post("/add-note", authenticateToken, async (req, res) => {

    const { title, content, tags } = req.body;
    const { user } = req.user;

    if (!title) {
        return res.status(400).json({ error: true, message: "title is required" });
    }

    if (!content) {
        return res.status(400).json({ error: true, message: "content is required" });
    }

    try {
        const note = new Note({
            title,
            content,
            tags: tags || [],
            userId: user._id,
        });

        await note.save();

        return res.json({
            error: false,
            note,
            message: 'note added successfully',
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "internal server error",
        })
    }

})


//edit note
app.put("/edit-note/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;

    if (!title && !content && !tags) {
        return res.status(400).json({ error: true, message: "no changes provided" })
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(404).json({ error: true, message: "note not found" });
        }

        if (title) note.title = title;
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if (isPinned) note.isPinned = isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message: "note updated successfully"
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "internal server error",
        });
    }
})

//get all notes
app.get("/get-all-notes", authenticateToken, async(req, res) => {
    const {user} = req.user;
    try{
        const notes = await Note.find({userId: user._id}).sort({isPinned: -1});

        return res.json({
            error: false, 
            notes, 
            message: "all notes retirieved successfully",
        });
    } catch(error){
        return res.status(500).json({
            error: true,
            message:"internal server error",
        });
    }
});

// delete note
app.delete("/delete-note/:noteId", authenticateToken, async(req, res)=>{
    const noteId = req.params.noteId;
    const {user} = req.user;

    try{
        const note = await Note.findOne({_id:noteId, userId: user._id});

        if(!note){
            return res.status(404).json({error:true, message:"note not found"});
        }

        await Note.deleteOne({_id:noteId, userId:user._id});

        return res.json({
            error:false,
            message: "note deleted successfully"
        })
    } catch(error){
        return res.status(500).json({
            error:true,
            message: "internal server error",
        })
    }
})

//pin notes
app.put("/update-note-pinned/:noteId", authenticateToken, async (req, res)=>{
  const noteId  = req.params.noteId;
  const{isPinned} = req.body;
  const{user} = req.user;

  try{
    const note = await Note.findOne({_id:noteId, userId:user._id});

    if(!note){
        return res.status(404).json({error: true, message:"note not found"});
    }

    note.isPinned = isPinned || false;

    await note.save();

    return res.json({
        error: false,
        note, 
        message:"note updated succesfully",
    })
  } catch(erro){
    return res.status(500).json({
        error: true,
        message: "internal server error"
    })
  }
})



app.listen(8000);

module.exports = app;