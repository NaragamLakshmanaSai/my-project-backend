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
  const { approved } = req.query

  const articles = await db.collection(type).find({ $and: [{"approved": {"$eq": approved}}, { "title" : { "$regex" : filter , "$options" : "i"} } ] }).toArray();
  res.send(articles);
});

app.get("/articles/:type/:id", async (req, res) => {
  const { type, id } = req.params;

  const blog = await db.collection(type).findOne({ name: id });
  res.send(blog);
});

app.put("/articles/:type/:id/like_comment_approve", async (req, res) => {
  const { type, id } = req.params;
  let {like, comment, userName, approved} = req.body;
  userName = userName || "anonymus"

  if(like){
    const blog = await db.collection(type).updateOne({ name: id }, {
        $inc: {
            likes: like
        }
    });
  }

  else if(comment){
    const blog = await db.collection(type).updateOne({ name: id }, {
        $push: {
            comments: { comment, userName }
        }
    });
  }

  else if(approved){
    console.log("apprved", approved);
    const blog = await db.collection(type).updateOne({ name: id }, {
      $set: {
          approved: approved
      }
    });
  }

  res.send("success");
});

app.put("/articles/:type/:id/delete", async (req, res) => {
  const { type, id } = req.params;

  if(type && id){
    const blog = await db.collection(type).deleteOne({ name: id });
  }

  res.send("success");
});

app.put("/publish-article", async(req, res) => {
  const {name, title, content, type} = req.body

  let contentArray = content.split('\n')

  await db.collection(type).insertOne({name, title, content: contentArray, approved: "false"})
  res.send("Published Successfully")
})

app.put("/user/create-account", async(req, res) => {
  const { name, phoneNumber, email, password } = req.body

  await db.collection("user").insertOne({name, phoneNumber, email, password})

  res.send("Registered Successfully")
})

app.post("/user/login", async(req, res) => {
  const { email, password } = req.body

  const user = await db.collection("user").findOne({ email, password})
  res.send(user)
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
