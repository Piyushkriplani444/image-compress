"use strict";

require("dotenv").config();

const express = require("express");
const cluster = require("cluster");
const cors = require("cors");
const http = require("http");
const { default: helmet } = require("helmet");
const bodyParser = require("body-parser");
const httpContext = require("express-http-context");
const totalCPUs = require("os").cpus().length;
const debug = require("debug")("image:server");
const uuid = require("node-uuid");
const imageCompressRoute = require("./server/imageUpload/routes/index");

if (cluster.isMaster) {
  console.log(`Number of CPUs is ${totalCPUs}`);
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log("Let's fork another worker!");
    cluster.fork();
  });
} else {
  const app = express();

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));

  app.use(cors());

  app.use(httpContext.middleware);

  app.use(function (req, res, next) {
    httpContext.set("reqId", uuid.v1());
    res.header("X-XSS-Protection", "1; mode=block");
    res.header("X-Frame-Options", "deny");
    res.header("X-Content-Type-Options", "nosniff");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, PUT, POST, DELETE , HEAD , OPTIONS"
    );
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept,Authorization, X-Token"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
  });

  let resource = "";
  let opsys = process.platform;

  if (opsys === "win32" || opsys === "win64") {
    resource = "C:";
  } else if (opsys === "linux") {
    resource = "/home";
  }
  app.use("/share", express.static(resource + "/share"));

  app.use("/uploads", express.static(resource + "/uploads"));

  const port = process.env.REACT_APP_SERVER_PORT || 3000;

  app.use("/api", imageCompressRoute);

  const server = http.createServer(app);

  server.listen(port);
  server.on("error", onError);
  server.on("listening", onListening);

  function onError(error) {
    if (error.syscall !== "listen") {
      throw error;
    }

    const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);

      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);

      default:
        throw error;
    }
  }

  function onListening() {
    const addr = server.address();
    console.info(
      `The server has started on port: ${process.env.REACT_APP_SERVER_PORT}`
    );
    const bind =
      typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    debug("Listening on " + bind);
  }
}
