import pino from "pino";
import { multistream } from "pino";

const prettyStream = {
  stream: pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      singleLine: true,
    },
  }),
};

const fileStream = {
  stream: pino.destination({
    dest: "logs/app.log",
    sync: false,
    mkdir: true, // Create the directory if it doesn't exist
    append: true, // Append to the file instead of overwriting
  }),
  level: "info",
};

const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
  },
  multistream([prettyStream, fileStream])
);

export default logger;
