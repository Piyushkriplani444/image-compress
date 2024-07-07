const express = require("express");

const routes = express.Router();
const upload = require("../../middleware/upload");

const imagecontroller = require("../controller/imageController");

routes.get("/", upload.single("csvFile"), imagecontroller.importCSV);

module.exports = routes;
