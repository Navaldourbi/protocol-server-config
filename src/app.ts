import express from "express";
import { Request,Response,NextFunction } from "express";
import log from "./utils/logger";
const app = express();

import config from "./utils/config";
import router  from "./routes/route";
import { configLoader } from "./utils/configs_new";
import cors from "cors"
const PORT = process.env.PORT

const args = process.argv.slice(2);
let mock = false
if (args[0]) {
  const path = args[0];
  const file : string = `./${path}/${path}.yaml`;
  startUp(file);   // startup with new mock only
}
else{
  startUp(undefined);  // startup with old mock
}

//After instuctionSet completion, read response here
async function startUp(file? :string) {
  var server :any ={}
  if(file){
  await config.loadConfig(file);
  server = config.getServer();
  }

  // buyer mck 
  configLoader
  .init()
  .then(() => {
    logger.info("Config loaded successfully.");
  })
  configLoader.getConfig()

  app.use(cors())

  app.use(express.json());
  const logger = log();

  app.use("*",(req: Request,res:Response,next:NextFunction)=>{
    logger.warn(`endpoint triggered   URL ---------> ${req.baseUrl}`)
    next()
  })

  app.listen(server.port || PORT , () => {
    logger.info(`This app is running on port number : ${server.port ||PORT}`);
  });
  app.use(router);
}

