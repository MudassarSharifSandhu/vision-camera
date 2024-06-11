const express = require('express');
const multer = require('multer');
const app = express();
const port = 3001;

const fs = require('fs');
const path = require('path');
path.join(__dirname, 'uploads')

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("uploadsDir",uploadsDir)
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '.mp4');
  },
});


const upload = multer({ storage: storage });

app.post('/upload', upload.single('video'), (req, res) => {
  console.log("req",req)
  res.status(200).send('Video uploaded successfully');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
