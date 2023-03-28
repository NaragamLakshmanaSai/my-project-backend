const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

let client, connection, db;

const app = express();
const port = 3020;

app.use(cors());
app.use(
  express.json({
    inflate: false, // delegate to nginx?
    limit: "500kb",
  })
);

app.post("/articles/:type", async (req, res) => {
  const { type } = req.params;
  const { filter } = req.body;

  const articles = await db.collection(type).find({ "title" : { "$regex" : filter , "$options" : "i"}}).toArray();
  res.send(articles);
});

app.get("/articles/:type/:id", async (req, res) => {
  const { type, id } = req.params;

  const blog = await db.collection(type).findOne({ name: id });
  res.send(blog);
});

app.put("/articles/:type/:id/like_and_comment", async (req, res) => {
  const { type, id } = req.params;
  const {like, comment, userName} = req.body;

  if(like){
    const blog = await db.collection(type).updateOne({ name: id }, {
        $inc: {
            likes: like
        }
    });
  }

  if(comment&&userName){
    const blog = await db.collection(type).updateOne({ name: id }, {
        $push: {
            comments: { comment, userName }
        }
    });
  }

  res.send("success");
});

app.put("/publish-article", async(req, res) => {
  const {name, title, content, type} = req.body
  console.log(name, title, content, type);

  let contentArray = content.split('\n')

  await db.collection(type).insertOne({name, title, content: contentArray})
  res.send("Published Successfully")
})

const connectToDB = async() => {
  client = new MongoClient("mongodb://127.0.0.1:27017");
  connection = await client.connect();
  db = client.db("my-blogs-db");
}
connectToDB()

app.listen(port, function () {
  console.log("Server started on port: " + port);
});
