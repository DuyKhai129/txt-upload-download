const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require('mongoose');
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const app = express();

//CONNECT DATABASE
mongoose.connect(process.env.mongoURI, () => {
  console.log("Connected to MongoDB");
});
try {
    mongoose.connect(process.env.mongoURI, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
  } catch (error) {
    handleError(error);
  }
  process.on('unhandledRejection', error => {
    console.log('unhandledRejection', error.message);
  });

  //creating bucket
let bucket;
mongoose.connection.on("connected", () => {
  var client = mongoose.connections[0].client;
  var db = mongoose.connections[0].db;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "newBucket"
  });
  console.log(bucket);
});
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

const storage = new GridFsStorage({
    url: process.env.mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        const filename = file.originalname;
        const fileInfo = {
          filename: filename,
          bucketName: "newBucket"
        };
        resolve(fileInfo);
      });
    }
  });
  
  const upload = multer({
    storage
  });
  // all file 
  app.get('/files', (req,res) =>{
    bucket.find().toArray((err, files) =>{
      if(!files || files.length === 0) {
          return res.status(404).json({
          err: "No file exist"
          });
      }
      return res.json(files);
    });
    });
  //detail file
  app.get("/fileinfo/:filename", (req, res) => {
    const file = bucket
      .find({
        filename: req.params.filename
      })
      .toArray((err, files) => {
        if (!files || files.length === 0) {
          return res.status(404)
            .json({
              err: "no files exist"
            });
        }
        bucket.openDownloadStreamByName(req.params.filename)
          .pipe(res);
      });
  });
  
  app.post("/upload", upload.single("file"), (req, res) => {
    res.status(200)
      .send("File uploaded successfully");
  });


app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 9090;
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
