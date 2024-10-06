const { createLogger, format, transports } = require("winston");
import LokiTransport from "winston-loki";
require("winston-daily-rotate-file");
const { combine, timestamp, printf, colorize } = format;
import config from "./config";

var logger: any;

function init() {
  if (!logger) {
    getLogger();
  }
  return logger;
}

function getLogger() {
  const myFormat = printf(
    ({
      level,
      message,
      timestamp,
      uuid,
    }: {
      level: any;
      message: any;
      timestamp: any;
      uuid: any;
    }) => {
      return ` [${uuid}][${timestamp}] [${level}]: ${message}`;
    }
  );
  const log = config.getLog();
  if(process.env.USE_LOKI){
    logger = createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: combine(timestamp(), colorize(), myFormat),
      transports: [
        new LokiTransport({
          host: process.env.LOKI_HOST as string,
          labels: {
            app:
              process.env.LOKI_APP_NAME ||
              `infra_dev
            `,
          },
          json: true,
          format: format.json(),
          replaceTimestamp: true,
          onConnectionError: (err: any) => logger.error(err),
        }),
        new transports.Console({
          format: combine(timestamp(), colorize(), myFormat),
        }),
      ],
    });
  }else{
    logger = createLogger({
      level: `{
        log: {
          level: "DEBUG",
          output_type: "file",
          out_file: "/logs/log_file.log",
        },
      }`,
  
      format: combine(timestamp(), colorize(), myFormat),
      transports: [
        new transports.Console({
          level: "debug",
        }),
        new transports.Console(),
      ],
    });
  }
  return logger;
}

export default init;
