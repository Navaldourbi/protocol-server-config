import fs from "fs";
import yaml from "yaml";
import path from "path";
import $RefParser from "@apidevtools/json-schema-ref-parser";
import axios from "axios";
import  logger from "./logger";



class ConfigLoader {
  config:any
  constructor() {
    this.config = null;
  }

  async init() {
    try {
      if (process.env.localConfig === "true") {
        const config = yaml.parse(
          fs.readFileSync(path.join(__dirname, "../../seller-mock-config/configs/igm/index.yaml"), "utf8")
        );
        const schema = await $RefParser.dereference(path.join(__dirname, "../../seller-mock-config/configs/igm/index.yaml"));

        this.config = schema;
        return schema

      }else{

      const url = process.env.CONFIG_URL_MAPPER;

      if (!url) {
        throw new Error("Config url not found");
      }

      const response = await axios.get(url);

      this.config = response.data;

      return response.data;
    }
    } catch (e : any) {
      throw new Error(e);
    }
  }

  getConfig() {
    return this.config;
  }

  getConfigBasedOnFlow(flowId : string) {
    let filteredInput = null;
    let filteredCalls = null;
    let filteredDomain = null;
    let filteredSessiondata = null;
    let filteredAdditionalFlows = null;
    let filteredsummary = "";
    let filtered_config = null

    this.config.flows.forEach((flow : any) => {
      if (flow.id === flowId) {
        const { input, calls, domain, sessionData, additioalFlows, summary, config_selector } =
          flow;
        filteredInput = input;
        filteredCalls = calls;
        filteredDomain = domain;
        filteredSessiondata = sessionData;
        filteredAdditionalFlows = additioalFlows || [];
        filteredsummary = summary;
        filtered_config = config_selector
      }
    });

    return {
      filteredCalls,
      filteredInput,
      filteredDomain,
      filteredSessiondata,
      filteredAdditionalFlows,
      filteredsummary,
      filtered_config
    };
  }

  getListOfFlow() {
    
    return this.config.flows
      .map((flow : any) => {
        if (flow.shouldDispaly) return { key: flow.summary, value: flow.id, version: flow.version };
      })
      .filter((flow : any) => flow);
  }

}

const configLoader = new ConfigLoader();

export { configLoader };
