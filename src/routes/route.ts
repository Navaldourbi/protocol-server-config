import express from "express";
const router= express.Router();
import  {onRequest} from "../services/service";
import { extractPath } from "../utils/mapper/buildPayload";
import {
  getCache,
  insertSession,
  handleRequestForJsonMapper
} from "../utils/mapper/utils";
import { configLoader }  from "../utils/configs_new";
import log from "../utils/logger";
const logger = log()
import axios from "axios"
import  { exec } from 'child_process';
import fs from "fs"



// transaction id fetch krta h || data 
router.get("/cache", async (req, res) => {
  try {
    const response = getCache(req.query.transactionid,req.query.subscriberId) || {
      message: "TransactionId does not have any data",
    };

    res.send(response);
  } catch (err) {
    logger.error("/cache  -  ", err);
  }
});

//session create
router.post("/mapper/session", (req, res) => {

  const { country, cityCode, transaction_id, configName } = req.body;

  if (!country || !cityCode || !transaction_id || !configName) {
    return res.status(400).send({
      data: "validations failed  country || cityCode || transaction_id || configName missing",
    });
  }

  logger.info("body>>>>> /mapper/session  -  ", req.body);

  try {
    const {
      filteredCalls,
      filteredInput,
      filteredDomain,
      filteredSessiondata,
      filteredAdditionalFlows,
      filteredsummary,
      filtered_config,
      filtered_default_payload
    }: any = configLoader.getConfigBasedOnFlow(configName);

    const session = {
      ...req.body,
      ttl: "PT10M",
      domain: filteredDomain,
      summary: filteredsummary,
      ...filteredSessiondata,
      currentTransactionId: transaction_id,
      transactionIds: [transaction_id],
      input: filteredInput,
      protocolCalls: filteredCalls,
      additioalFlows: filteredAdditionalFlows,
      config_selector: filtered_config,
      deafult_payload: filtered_default_payload
    };

    insertSession(session);
    res.send({ sucess: true, data: session });
  } catch (e) {
    logger.error("Error while creating session  -  ", e);
    res.status(500).send("Internal Server Error");
  }
});

// on request k liye listen session.protocol calls ko update krti h -- should render
router.post("/mapper/timeout", async (req, res) => {

  const { config, transactionId } = req.body;

  if (!config || !transactionId) {
    return res
      .status(400)
      .send({ data: "validations failed config || transactionid missing" });
  }

  let session = getCache("jm_" + transactionId);

  if (!session) {
    return res.status(400).send({ data: "No session found." });
  }

  session.protocolCalls[config].shouldRender = false;
  const preConfig = session.protocolCalls[config].preRequest;

  // makes these changes in the session
  session.protocolCalls[preConfig] = {
    ...session.protocolCalls[preConfig],
    executed: false,
    shouldRender: true,
    becknPayload: null,
    businessPayload: null,
    messageId: null,
  };

  // insertSession(session);
  return res.status(200).send({ session });
});

// extractPath is copy code from protocol server takes in payload and path and extracts the data
router.post("/mapper/extractPath", (req, res) => {
  const { path, obj } = req.body;

  if (!path || !obj) {
    return res.status(400).send({ data: "missing path || obj " });
  }
  try {
    // input payload is provided along with path
    const response = extractPath(path, obj);

    res.send({ response });
  } catch (e) {
    logger.info("Error while extracting path  -  ", e);
    res.status(400).send({ error: true, data: e });
  }
});

// if some calls needs to be reexecuted
router.post("/mapper/repeat", async (req, res) => {
  const { transactionId, config } = req.body;

  if (!transactionId || !config) {
    return res.status(400).send({ data: "missing transactionId || config" });
  }

  let session = getCache("jm_" + transactionId);

  if (!session) {
    return res.status(400).send({ data: "No session found." });
  }

  session.protocolCalls[config] = {
    ...session.protocolCalls[config],
    becknPayload: null,
    businessPayload: null,
    messageId: null,
    executed: false,
    shouldRender: true,
  };

  let nextConfig = session.protocolCalls[config].nextRequest;

  while (nextConfig) {
    if(session.protocolCalls[nextConfig] === undefined){
      console.log("hello")
    }
    if (
 
      !session.protocolCalls[nextConfig].shouldRender &&
      !session.protocolCalls[nextConfig].executed
    )
      break;

    session.protocolCalls[nextConfig] = {
      ...session.protocolCalls[nextConfig],
      becknPayload: null,
      businessPayload: null,
      messageId: null,
      executed: false,
      shouldRender: false,
    };

    nextConfig = session.protocolCalls[nextConfig].nextRequest;
  }

  insertSession(session);

  res.send({ session });
});


// not being used
router.post("/mapper/addFlow", (req, res) => {
  const { configName, transactionId } = req.body;

  let session = getCache("jm_" + transactionId);

  if (!session) {
    return res.status(400).send({ data: "No session found." });
  }

  const { filteredCalls, filteredInput } : any =
    configLoader.getConfigBasedOnFlow(configName);

  session.protocolCalls = { ...session.protocolCalls, ...filteredCalls };
  session.input = { ...session.input, ...filteredInput };

  insertSession(session);

  res.send({ session });
});

router.get("/mapper/flows", (_req, res) => {
  const flows = configLoader.getListOfFlow();

  logger.info("Flows", flows);

  res.send({ data: flows });
});

// protocol server se jo unsolicated calls at h 
//protocol -> hits this endpoint 
// to mark a call unsolicated if a call comes in a transaction id with new message id not being sent by us
router.post("/mapper/unsolicited", async (req, res) => {
  logger.info("Indise mapper unsolicited");
  const { businessPayload, updatedSession, messageId, response } = req.body;

  if (!businessPayload || !updatedSession || !messageId || !response) {
    return res.status(400).send({
      message:
        "businessPayload || updatedSession|| response || messageId not present",
    });
  }

  

  handleRequestForJsonMapper(
    businessPayload,
    updatedSession,
    messageId,
    updatedSession?.transaction_id,
    response,
    true,
    res
  );

  res.send({ success: true });
});


// baki calls k liye protocol server se jo responses atey h wo idhar atey h 
// on_search || on_select for buyer case if async mode 
router.post("/mapper/ondc", async (req, res) => {
  logger.info("inside mapper config");
  const { businessPayload, updatedSession, messageId, response } = req.body;


  if (!businessPayload || !updatedSession || !response) {
    logger.error("Bad Request Validation failed  businessPayload || updatedSession || response || messageId not present ")
    return res.status(400).send({
      message:
        "businessPayload || updatedSession || response || messageId not present",
    });
  }

  handleRequestForJsonMapper(
    businessPayload,
    updatedSession,
    messageId,
    response.context?.transaction_id,
    response,
    false,
    res
  );

  res.send({ success: true });
});

// sandbox ui -> buyer mock 
router.post("/mapper/:config", async (req, res) => {
  let { transactionId, payload } = req.body;
  const config = req.params.config;
  let session = getCache("jm_" + transactionId);

  logger.info("cofig> ", config);

  if (!session) {
    return res.status(400).send({ message: "No session exists" });
  }

  // payload = {...payload, ...session.deafult_payload[config]}
  payload = {...payload, ...session.protocolCalls[config].default_payload}

  // handle form
  if (session.protocolCalls[config].type === "form") {
    session.protocolCalls[config] = {
      ...session.protocolCalls[config],
      executed: true,
      shouldRender: true,
      businessPayload: payload,
    };
    session = { ...session, ...payload };

    const nextRequest = session.protocolCalls[config].nextRequest;

    session.protocolCalls[nextRequest] = {
      ...session.protocolCalls[nextRequest],
      shouldRender: true,
    };

    try {
      await axios.post(`${process.env.PROTOCOL_SERVER_BASE_URL}updateSession`, {
        sessionData: payload,
        transactionId: transactionId,
      });
    } catch (e : any) {
      logger.error(
        "Error while update session for protocol server: ",
        e?.message || e
      );
      throw new Error("Error while update session for protocol server");
    }

    insertSession(session);

    return res.status(200).send({ session });
  }

  let protocolSession = JSON.parse(JSON.stringify(session));
  delete protocolSession.input;
  delete protocolSession.protocolCalls;

  console.log("sending Transdcaiton ID", transactionId);




  try {
    let response = {data:{message:{becknPayload:{context:{message_id:"dummyid"}}}}}
    if(session.protocolCalls[config].type != "on_selector"){
      
     response = await axios.post(
      `${process.env.PROTOCOL_SERVER_BASE_URL}createPayload`,
      {
        type: session.protocolCalls[config].type,
        config: session.protocolCalls[config].type,
        configName: session.configName,
        data: payload,
        transactionId: transactionId,
        target: session.protocolCalls[config].target,
        session: {
          createSession: session.protocolCalls[config].target === "GATEWAY",
          data: protocolSession,
        },
        ui:true
      }
    );
  }



    let mode = "SYNC";

    const { becknPayload, updatedSession, becknReponse, businessPayload } : any =
      response.data.message;

    if (!businessPayload) {
      mode = "ASYNC";
    }

    session = { ...session, ...updatedSession, ...payload };

    // incase session is updated by unsolicited call
    const updatedLocalSession = getCache("jm_" + transactionId);

    session = { ...session, ...updatedLocalSession };

    console.log("MODE", mode);

    if (mode === "ASYNC") {
      session.protocolCalls[config] = {
        ...session.protocolCalls[config],
        executed: true,
        shouldRender: true,
        becknPayload: becknPayload,
        businessPayload: payload,
        messageId: becknPayload.context.message_id,
        becknResponse: becknReponse,
      };

        const nextRequest = session.protocolCalls[config].nextRequest;


  // skippable code (Skip or provide payload according to condition)
  let skippable 
  
  if (
    session.protocolCalls[nextRequest]?.isSkipable && Array.isArray(session.protocolCalls[nextRequest]?.isSkipable)
  ) {
    skippable = session.protocolCalls[nextRequest]?.isSkipable.find((element: any)=>eval(element.condition))
  } 

      if(skippable === undefined)
      {
              session.protocolCalls[nextRequest] = {
        ...session.protocolCalls[nextRequest],
        shouldRender: true,
      };
        // session.protocolCalls[thirdRequest].shouldRender = true;
      }else{
        session.protocolCalls[
          skippable.nextRequest
        ].shouldRender = true;
      }



    } else {
      session.protocolCalls[config] = {
        ...session.protocolCalls[config],
        executed: true,
        shouldRender: true,
        becknPayload: becknPayload.action,
        businessPayload: payload,
        messageId: becknPayload.action.context.message_id,
        // becknResponse: becknReponse,
      };

      let nextRequest = session.protocolCalls[config].nextRequest;

      session.protocolCalls[nextRequest] = {
        ...session.protocolCalls[nextRequest],
        executed: true,
        shouldRender: true,
        becknPayload: becknPayload.on_action,
        businessPayload: businessPayload,
        // messageId: becknPayload.action.context.message_id,
        // becknResponse: becknReponse,
      };

      nextRequest = session.protocolCalls[nextRequest].nextRequest;

      if (nextRequest) {
        session.protocolCalls[nextRequest] = {
          ...session.protocolCalls[nextRequest],
          shouldRender: true,
        };
      }
    }

    insertSession(session);

    res.status(200).send({ response: response.data, session });
  } catch (e: any) {
    logger.error("Error while sending request  -  ", e?.response?.data || e);
    return res.status(500).send({ message: "Error while sending request", e });
  }
});

// use nhi hota
router.post("/submissionId", async (req, res) => {
  const { url } = req.body;

  try {
    const response = await axios.post(url, {});

    console.log("response", response);

    res.send({ id: response.data.submission_id });
  } catch (e : any) {
    res.status(400).send({ error: true, message: e.message || e });
  }
});

// not being used
router.post("/executeTransaction/:transactionId", async (req, res) => {
  const transactionId = req.params.transactionId;

  let session = getCache("jm_" + transactionId);

  session.protocolCalls;
});

router.get("/restart",(req,res)=>{
  res.send('Server restarted successfully');
  fs.appendFile("test.js", "contentToAppend", (err) => {
    if (err) throw err;
    console.log('Content appended to file!');
  });
// });
})

router.all("/*", (req, res) => {
  console.log("call received")
  return onRequest(req,res);
  });



export default router;