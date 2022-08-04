// Logic
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");

//models
const { Files } = require("../../models/model");

module.exports = (router) => {
  const conn = mongoose.connection;
  Grid.mongo = mongoose.mongo;
  let gfs;

  conn.once("open", () => {
    gfs = Grid(conn.db);

    router.post("/bucket/upload", (req, res) => {
     //let { file } = req.files;
      let writeStream = gfs.createWriteStream({
        filename: req.files.name,
        mode: "w",
        content_type:  req.files.mimetype,
      });
      writeStream.on("close", function (uploadedFile) {
        Files.create({
          doc_id: uploadedFile._id,
          length: uploadedFile.length,
          name: uploadedFile.filename,
          type: uploadedFile.contentType,
        })
          .then((_) =>
            res.json({
              success: true,
              message: "File was saved with success",
            })
          )
          .catch((err) => {
            console.log(err);
            res.status(500).json({
              message: `[*] Error while uploading new files, with error: ${err}`,
            });
          });
      });
      writeStream.write( req.files.data);
      writeStream.end();
    });
  });
};
