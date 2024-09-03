const { formatted_error } = require("../utils/utils");
const Ajv = require("ajv");
const ajv = new Ajv({
  allErrors: true,
  strict: "log",
});
const {
  createAuthorizationHeader,
  isSignatureValid,
} = require("ondc-crypto-sdk-nodejs");
const { buildTemplate,getPublicKey } = require("../utils/utils");
const { trigger } = require("./triggerService");
import {ack,schemaNack} from "../utils/acknowledgement"
const operator = require("../operator/util");
const addFormats = require("ajv-formats");
addFormats(ajv);
require("ajv-errors")(ajv);
const log = require("../utils/logger");
//schema validation

var logger;

const validateSchema = async (context : any) => {
  logger = log.init();
  logger.info(
    `Inside schema validation service for ${context?.req_body?.context?.action} api`
  );
  try {
    const validate = ajv.compile(context.apiConfig.schema);
    const valid = validate(context.req_body);
    if (!valid) {
      let error_list = validate.errors;
      logger.error(JSON.stringify(formatted_error(error_list)));
      logger.error("Schema validation : FAIL");
      logger.error(context?.req_body?.context?.transaction_id)
      return false;
    } else {
      logger.info("Schema validation : SUCCESS");
      return true;
    }
  } catch (error) {
    logger.error(error);
  }
};

const validateRequest = async (
  context : any,
  callbackConfig : any,
  res : any,
  security : any,
  server : any,
  isFormFound : any,
  flag : boolean //true for not sending responses
)  => {
  logger = log.init();
    //handle callbacks in case of multiple callback
    if(callbackConfig.callbacks){
        for (let i = 0 ; i < callbackConfig.callbacks.length ; i++){
         
          validateRequest(context,callbackConfig.callbacks[i],res,security,server,isFormFound,i===0?false:true)
        }
        return
    }

    //triggering the subsequent request
    var payloadConfig = callbackConfig?.payload;
    if (payloadConfig != null) {
      let data = "";
      if (payloadConfig["template"]) {
        data = buildTemplate(context, callbackConfig?.payload?.template);
      }
      
      //transform back to ondc payload JSON_MAPPER
      // if(server.protocol_server.includes(context.req_body.context.domain)){
      //   data = await getBecknObject(data)
      // }
      
      // jsonout(data,data.context.action)
      if (callbackConfig.callback === "undefined"|| server.sync_mode  && !flag ) {
        return isFormFound ? res.send(payloadConfig) : res.json(data);
      } else {
        context.response_uri = resolveObject(context, callbackConfig.uri);
        logger.info(`Callback for this request: ${callbackConfig.callback}`);
        trigger(context, callbackConfig, data,server);
      }
      return !flag?res.json(ack):false
    } 

  }



function resolveObject(context : any, obj : any) {
  if (obj["operation"]) {
    return operator.evaluateOperation(context, obj["operation"]);
  } else if (obj["value"]) {
    return obj["value"];
  }
  return obj;
}

module.exports = { validateSchema, validateRequest };
