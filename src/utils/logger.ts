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
  logger = createLogger({
    level: log,
    format: combine(timestamp(), colorize(), myFormat),
    transports: [
      new LokiTransport({
        host: process.env.LOKI_HOST as string,
        labels: {
          app: process.env.LOKI_APP_NAME || `infra_seller_mock_engine`,
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
  return logger;
}

export default init;
