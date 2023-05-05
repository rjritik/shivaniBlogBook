import express, { urlencoded } from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.json());
app.use(cors());

const encrpt = (password) => {
  const salt = bcrypt.genSaltSync(10);
  let hashed = bcrypt.hashSync(password, salt);
  return hashed;
};
mongoose.connect("mongodb://0.0.0.0:27017/myloginRegisterDB", {
  useUnifiedTopology: true,
});

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phoneNumber: String,
});

const dataSchema = mongoose.Schema({
  title: String,
  content: String,
  image: String,
});

const User = new mongoose.model("User", userSchema);
const Data = new mongoose.model("Data", dataSchema);
app.post("/register", (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  User.findOne({ email: email }, (err, user) => {
    if (user) {
      res.send({ message: "User already register" });
    } else {
      const pass = encrpt(password);
      const user = new User({
        name,
        email,
        password: pass,
        phoneNumber,
      });
      user.save((err) => {
        if (err) {
          res.send(err);
        } else {
          res.send({ message: "Successfully Register" });
        }
      });
    }
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email: email }, (err, user) => {
    if (user) {
      const validPassword = bcrypt.compareSync(password, user.password);
      if (validPassword) {
        var token = jwt.sign({ id: user.id }, "bezkoder-secret-key", {
          expiresIn: 86400,
        });
        res.send({ message: "Login Successfully", user: user, token: token });
      } else {
        res.send({ message: "Invalid password" });
      }
    } else {
      res.send({ message: "User not found" });
    }
  });
});

app.post("/posts", async (req, res) => {
  const { title, contnet, image, id } = req.body;
  if (id) {
    if (image) {
      await Data.updateOne(
        { _id: id },
        { title: title, content: contnet, image: image }
      );
    } else {
      await Data.updateOne({ _id: id }, { title: title, content: contnet });
    }
    res.send({ message: "Posted Successfully" });
    return;
  } else {
    const data = new Data({
      title: title,
      content: contnet,
      image: image,
    });
    data.save((err) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ message: "Posted Successfully" });
      }
    });
  }
});

app.get("/getposts", async (req, res) => {
  let allPosts = await Data.find({});
  return res.status(200).json(allPosts);
});

app.delete("/posts/:id", (req, res) => {
  Data.deleteOne({ _id: req.params.id }).then(() => {});
});

app.listen(9002, () => {
  console.log("Server Started ");
});
