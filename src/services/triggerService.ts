const config = require("../utils/config");
import log from "../utils/logger";
const axios = require("axios");
const {
  createAuthorizationHeader
} = require("ondc-crypto-sdk-nodejs");
//getting path object from config file

var logger : any;

const trigger = async(context : any, config : any, data : any,server : any) => {
  logger = log();
  let uri = server.protocol_server.uri
  let delay = config.delay;
  try {
    logger.info("Inside trigger service");
    let header ={}

    setTimeout(() => {
      axios
        .post(`${uri}`, data,header)
        .then((response : any) => {
          logger.info(
            `Triggered response at ${uri}`
          );
        })
        .catch(function (error : any) {
          // console.log(error)
          logger.error(`${error}`);
        });
    }, delay);
  } catch (error) {
    logger.error(`!!Error while triggering the response,`, error);
  }
};

module.exports = { trigger };
