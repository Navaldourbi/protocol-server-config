const { getPublicKey,dynamicReponse } = require("../utils/utils");
const {  signNack,invalidNack } = require("../utils/acknowledgement");
import log from "../utils/logger"
import config from "../utils/config"
const { validateRequest, verifyHeader ,validateSchema} = require("./validation");
// const triggerMapper = require("../utils/json_mapper")
const { ack, schemaNack,sessionNack,sessionAck } = require("../utils/acknowledgement");
//getting path object from config file
import { Request,Response } from "express";

var paths : any;
var props : any;
var security : any;
var logger : any;
var server : any;
var PROTOCOL_SERVER_DOMAINS;
const matchText = 'form/' 

const onRequest = async (req: Request, res: Response) => {
  if (paths == undefined) {
    logger = log();
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
        req_body: req.body.businessPayload,
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

export { onRequest };
