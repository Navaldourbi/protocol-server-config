const fs = require("fs");

require("dotenv").config();

// const yaml = require('js-yaml');
// const fs = require('fs');
const yaml = require("yaml");
const $RefParser = require("json-schema-ref-parser");

var config;


async function loadConfig(filePath) {
  if(parseBoolean(process.env.localConfig)){
      // const filePath = "./config.yaml";
  const yamlString = fs.readFileSync(filePath, "utf8");
  const yamlObject = yaml.parse(yamlString);
  // config = yamlObject;
  config = await $RefParser.dereference(yamlObject);
  }else{
    config = await loadConfigFromUrl()
  }

}

function getConfig() {
  if (!config) {
    loadConfig("./config.yaml");
  }
  return config;
}

function getServer() {
  const server = config.server;
  return server;
}

function getPaths() {
  return config.path;
}

function getLog() {
  return config?.log;
}






// ${branchName}`;

async function loadConfigFromUrl() {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `${process.env.config_url}`;
      const response = await fetch(url);
      //   const x = await response.text()
      const formattedResponse = await response.json();
      //   return
        let splitedText = atob(formattedResponse?.content);
      build_spec = JSON.parse(getStringAfterEquals(splitedText));
      resolve(build_spec);
    } catch (err) {
      console.log(err);
    }
  });
}

function getStringAfterEquals(inputString) {
  const index = inputString.indexOf("=");
  if (index !== -1) {
    return inputString.slice(index + 1).trim();
  } else {
    return "";
  }
}
const parseBoolean = (value) => {
  // Convert 'true' to true and 'false' to false
  if (value === 'true') {
      return true;
  } else if (value === 'false') {
      return false;
  }
  // Return null for other values
  return null;
}

module.exports = {
  getServer,
  getPaths,
  getLog,
  loadConfig,
  getConfig,
  // loadConfigFromUrl
};