const { getPublicKey,dynamicReponse } = require("../utils/utils");
const {  signNack,invalidNack } = require("../utils/acknowledgement");
const log = require("../utils/logger");
const config = require("../utils/config");
const { validateRequest, verifyHeader ,validateSchema} = require("./validation");
// const triggerMapper = require("../utils/json_mapper")
const { ack, schemaNack,sessionNack,sessionAck } = require("../utils/acknowledgement");

//getting path object from config file

var paths;
var props;
var security;
var logger;
var server;
const matchText = 'form/' 

const onRequest = async (req, res) => {
  if (paths == undefined) {
    logger = log.init();
    props = config.getConfig();
    security = props.security;
    server = props.server;
    paths = props.path;
    PROTOCOL_SERVER_DOMAINS = props.server.protocol_server
  }
  try {
    let api = req.params['0']

    
    const isFormFound = req.params['0']?.match(matchText); //true if incoming request else false
    if(isFormFound){
      api = req.params['0'].replace(/\//g, '_'); 
    }
    logger.info(`Received ${req.url} api request`);


    //getting the callback url from config file
    let callbackConfig;
    let context;
    if (paths[api]) {
      // TODO add senario selection
      context = {
        req_body: req.body,
        apiConfig: paths[api],
      };
        callbackConfig = dynamicReponse(context) // get callback 
        await validateRequest(context, callbackConfig, res, security, server, isFormFound);
 
    } else {
      logger.error("Invalid Request");
      return res.json(invalidNack);
    }
    

  } catch (error) {
    logger.error("ERROR!!", error);
    console.trace(error);
  }
};

module.exports = { onRequest };
