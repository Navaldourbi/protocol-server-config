const { createLogger, format, transports} = require('winston');

require('winston-daily-rotate-file');
const { combine, timestamp, printf,colorize } = format;
import config from "./config";


var logger : any;


function init() {
  if (!logger) {
    getLogger()
  }
  return logger
}

function getLogger() {
  const myFormat = printf(({ level , message , timestamp }:{level: any, message:any, timestamp: any}) => {
    return `[${timestamp}] [${level}]: ${message}`;
  });
  const log = config.getLog();
  logger = createLogger({
    level: log,
    format: combine(
      timestamp(),
      colorize(),
      myFormat 
    ),
    transports: process.env.enableLogging === "true"?
     [
      new transports.Console({
        level: 'debug'
      }),
      new transports.DailyRotateFile({
        filename: './logs/log_report',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        level: 'info'
      }),
      new transports.Console
    ]:[]
  });
  return logger
}



export default init;