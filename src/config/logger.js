const winston = require("winston");
const path = require("path");

// Define log levels and colors
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
  },
};

winston.addColors(logLevels.colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports (where logs will be stored)
const transports = [
  // Console transport
  new winston.transports.Console(),

  // Error log file
  new winston.transports.File({
    filename: path.join(__dirname, "..", "..", "logs", "error.log"),
    level: "error",
  }),

  // All logs file
  new winston.transports.File({
    filename: path.join(__dirname, "..", "..", "logs", "all.log"),
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "warn",
  levels: logLevels.levels,
  format,
  transports,
});

module.exports = logger;
