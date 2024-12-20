const cache = require("node-cache");
import  {
  createAuthorizationHeader,
  isSignatureValid,
} from "ondc-crypto-sdk-nodejs";
const axios = require("axios");
const { extractBusinessData } = require("./buildPayload");
const myCache = new cache({ stdTTL: 100, checkperiod: 120 });
import log from"../logger";
const { dynamicReponse,incomingConfigSelector } = require("../utils");
const logger = log()
import { Response } from "express";

function getCache(key: any,subscriberId?:any) {
  if(subscriberId){
    return getTransactionIdBySubscriberId(subscriberId)
  }
  if (key === undefined || key === "") {
    // return myCache.keys();
    return filterTransactionIdByFlow()
  }
  return myCache.get(key);
}

const flows = ["invoice-loan-seller-flow-1"]

function filterTransactionIdByFlow(){
  const keys = myCache.keys()
  return keys.filter((key :string)=>{
    if(flows.includes(myCache.get(key).configName)){
      return key
    }else{
      return []
    }
  })
}

function getTransactionIdBySubscriberId(subscriberId:string){
  const keys = myCache.keys()
  return keys.filter((key: string)=>{
    if(myCache.get(key).bap_id === subscriberId){
      return key
    }
  })
}

const insertSession = (session: any) => {
  myCache.set("jm_" + session.transaction_id, session, 86400);
};

const handleRequestForJsonMapper = async (
  businessPayload: any,
  updatedSession : any,
  messageId: any,
  sessionId: any,
  response: any,
  unsolicited = false,
  res: Response
) => {
  try{
    const action = response?.context.action
    if(action === undefined){
      throw new Error ("action not found in the incoming config")
    }
  const ack = {
    message: {
      ack: {
        status: "ACK",
      },
    },
  };

  let session = getCache("jm_" + sessionId);

  if (!session) {
    // if session does not exist then create the session in seller ui
    const sessionCreateObject = {
      country:updatedSession.country,
      cityCode: updatedSession.cityCode,
      transaction_id : sessionId,
      configName: updatedSession.configName
    }
    console.log("pathe222",`${process.env.DEPLOYED_URL}/mapper/session}`)
    const result = await axios.post(`${process.env.DEPLOYED_URL}/mapper/session`,sessionCreateObject)
     session = getCache("jm_" + sessionId);

    if(!result.status){
      console.log("unable to create session")
      return res.status(400).send("unable to create session at seller engine")
    }
  }


  let {config} = incomingConfigSelector(response,session?.config_selector[action])
  let currentConfig = "";


  // Object.entries(session.protocolCalls).map((item) => {
  //   const [key, value] = item;
  //   // checks incoming call message id to map which call (search/select) it belongs to 
  //   // to keep it simple currently removing this check 

    
  //   if (value.config === response.context.action) {  // if action matches to config name then config (next Request will be updated here)
  //     config = key;
  //   }

  //   // config selector for incoming traffic


  //   if (value.shouldRender && !value.executed) {
  //     currentConfig = value.config;
  //   }


  // });

  // unsolicited
  // if (unsolicited) {
  //   logger.info("unsolicited call", response?.context);

  //   const action = response?.context?.action;
  //   if (!session.protocolCalls[action]) {
  //     return;
  //   }
  //   // const { result: businessPayload, session: updatedSession } =
  //   //   extractBusinessData(
  //   //     action,
  //   //     response,
  //   //     session,
  //   //     session.protocolCalls[action].protocol
  //   //   );

  //   session = { ...session, ...updatedSession };

  //   session.protocolCalls[currentConfig] = {
  //     ...session.protocolCalls[currentConfig],
  //     unsolicited: {
  //       config: action,
  //       type: action,
  //       executed: true,
  //       shouldRender: true,
  //       becknPayload: [response],
  //       businessPayload: [businessPayload],
  //       becknResponse: [ack],
  //     },
  //   };

  //   insertSession(session);
  //   return;
  // }

  console.log("got config", config);

  // let nextRequest = session.protocolCalls[config]?.nextRequest;
let nextRequest = config
  if (!nextRequest) {
    null;
  }

  // const { result: businessPayload, session: updatedSession } =
  //   extractBusinessData(
  //     nextRequest,
  //     response,
  //     session,
  //     session.protocolCalls[nextRequest].protocol
  //   );

  session = { ...session, ...updatedSession };


  session.protocolCalls[nextRequest] = {
    ...session.protocolCalls[nextRequest],
    executed: true,
    shouldRender: true,
    becknPayload: [
      ...(session.protocolCalls[nextRequest].becknPayload || []),
      response,
    ],
    businessPayload: [
      ...(session.protocolCalls[nextRequest].businessPayload || []),
      businessPayload,
    ],
    becknResponse: [
      ...(session.protocolCalls[nextRequest].becknResponse || []),
      ack,
    ],
  };
  console.log("sessionprotocolcalls",session.protocolCalls)
  const thirdRequest = session.protocolCalls[nextRequest].nextRequest;
  
  if (thirdRequest) {
    // if (protocolCalls[thirdRequest].isSkipable) {
    //   protocolCalls[
    //     protocolCalls[thirdRequest].isSkipable.nextRequest
    //   ].shouldRender = true;
    // } else {
    //   protocolCalls[thirdRequest].shouldRender = true;
    // }

    session.protocolCalls[thirdRequest].shouldRender = true;
  }

  insertSession(session);

}
catch(err){
  console.error("encountered error ",err)
}
};

export {
  getCache,
  insertSession,
  handleRequestForJsonMapper,
};
