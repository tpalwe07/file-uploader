const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const upload = multer();

const storage = new Storage({
  projectId: "http://myappie-463ba.appspot.com",
  keyFilename: "./google-cloud-key.json",
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/getAllFiles", (req, res) => {
  // Get a reference to your bucket and folder
  const bucketName = "myappie-463ba.appspot.com";
  const folderName = "uploads/";
  const bucket = storage.bucket(bucketName);

  // List all files in the folder
  bucket
    .getFiles({
      prefix: folderName,
    })
    .then((results) => {
      const files = results[0];
      console.log(`Files in ${folderName}:`);
      const publicUrls = files.map((file) => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
        console.log(publicUrl);
        return publicUrl;
      });
      res.json(publicUrls);
    })
    .catch((err) => {
      console.error("ERROR:", err);
      res.statusCode(404).send("Not found!");
    });
});

app.post("/upload", upload.single("file"), (req, res) => {
  const formData = req.body;
  const file = req.file;
  const fileName = file ? file.originalname : "example";
  console.log("Uploaded file:", fileName);
  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  const bucketName = "myappie-463ba.appspot.com";
  const destination = `uploads/${fileName}`;

  try {
    const bucket = storage.bucket(bucketName);
    const fileUpload = bucket.file(destination);
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });
    stream.on("error", (err) => {
      console.error(`Error uploading file: ${err}`);
      res.status(500).send(`Error uploading file: ${err}`);
    });
    stream.on("finish", () => {
      console.log(`File uploaded to ${destination}`);
      res.status(200).send("File uploaded");
    });
    stream.end(file.buffer);
  } catch (err) {
    console.error(`Error uploading file: ${err}`);
    res.status(500).send(`Error uploading file: ${err}`);
  }
});

app.listen(8000, () => {
  console.log("Server started on port 8000");
});