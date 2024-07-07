const multer = require("multer");
const path = require("path");

let directory;
const opsys = process.platform;

if (opsys === "win32" || opsys === "win64") {
  directory = "C:/share";
} else if (opsys === "linux") {
  directory = "/home/share";
}

const storage = multer.diskStorage({
  destination: directory,
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });
module.exports = upload;
