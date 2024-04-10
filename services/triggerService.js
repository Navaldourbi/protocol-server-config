const config = require("../utils/config");
const log = require("../utils/logger");
const axios = require("axios");
const {
  createAuthorizationHeader
} = require("ondc-crypto-sdk-nodejs");
//getting path object from config file

var logger;

const trigger = async(context, config, data,server) => {
  logger = log.init();
  let uri = server.protocol_server.uri
  let delay = config.delay;
  try {
    logger.info("Inside trigger service");
    let header ={}

    setTimeout(() => {
      axios
        .post(`${uri}`, data,header)
        .then((response) => {
          logger.info(
            `Triggered response at ${uri}`
          );
        })
        .catch(function (error) {
          // console.log(error)
          logger.error(`${error}`);
        });
    }, delay);
  } catch (error) {
    logger.error(`!!Error while triggering the response,`, error);
  }
};

module.exports = { trigger };
