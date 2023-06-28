const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    let extArray = file.mimetype.split("/");
    let extension = extArray[extArray.length - 1];
    cb(null, file.fieldname + "-" + Date.now() + "." + extension);
  },
});
const upload = multer({ storage: storage });

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/videolist", function (req, res) {
  const vidoeDir = path.join(__dirname, "videos");
  fs.readdir(vidoeDir, function (err, files) {
    if (err) {
      res.status(500).send("error reading videolist");
    } else {
      let name = files.map((filename) => filename.replace(/-\d+p/, ""));
      res.status(200).json(name);
    }
  });
});

app.get("/filelist", function (req, res) {
  const vidoeDir = path.join(__dirname, "uploads");
  fs.readdir(vidoeDir, function (err, files) {
    if (err) {
      res.status(500).send("error reading videolist");
    } else {
      let name = files.map((filename) => filename.replace(/-\d+p/, ""));
      res.status(200).json(name);
    }
  });
});

app.get("/video", function (req, res) {
  // Ensure there is a range given for the video
  const range = req.headers.range;
  console.log(range);
  if (!range) {
    res.status(400).send("Requires Range header");
  }
  const videoPath = `./videos/Chris-Do-${req.query.quality}.mp4`;
  const videoSize = fs.statSync(videoPath).size;

  const CHUNK_SIZE = 10 ** 6; // 1MB
  console.log(videoSize, "===========", CHUNK_SIZE, req.query);
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // Create headers
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(videoPath, { start, end });
  //   videoStream.on('data', function (chunk) {
  //     console.log(chunk.toString());
  // });

  // Stream the video chunk to the client
  videoStream.pipe(res);
});

app.post("/update-file", upload.array("files"), uploadFiles);

function uploadFiles(req, res) {
  console.log(req.body);
  console.log(req.files);
  res.json({ message: "Successfully uploaded files" });
}

app.get("/view-file/:filename", (req, res) => {
  const filename = "./uploads/" + req.params.filename;

  fs.readFile(filename, (err, data) => {
    if (err) {
      res.status(404).send("File not found");
    } else {
      const fileURL =
        req.protocol +
        "://" +
        req.get("host") +
        "/uploads/" +
        req.params.filename;
      res.json({ fileURL: fileURL });
      // res.contentType('image/png');
      // res.send(data);
    }
  });
});

app.get("/uploads/:filename", (req, res) => {
  const filename = "./uploads/" + req.params.filename;

  fs.readFile(filename, (err, data) => {
    if (err) {
      res.status(404).send("File not found");
    } else {
      let types = req.params.filename.split(".");
      let extension = types[types.length - 1];
      if (extension == "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        console.log(extension)
       return res.send(data);
      } else {
        let type = `image/${extension}`;
        res.contentType(type);
       return res.send(data);
      }
    }
  });
});

app.listen(8000, function () {
  console.log("Listening on port 8000!");
});
