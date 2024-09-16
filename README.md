# Introduction

The Seller mock engine pulls latest config from github with github api and forms a structural logic to run seller ui or mock server, this ensures that the seller mock engine is running with latest configs.

The primary purpose of seller mock engine is to act as a business layer behind the protocol server.

# Repository Structure

- `/config` - stores configs in yamls if running local config
- `src` - contains all programming logic in typescript
- `logs` - logs output folder if enableLogging flag is true in env
- `package.json` - contains dependencies
- `tsconfig.json` - typescript configurations

# Submodules intialization

- Initialize submodules

```
git submodule
```

- Updates submodules to the specific commit that is recorded in the main repository’s current commit

```
git submodule update
```

- Updates the submodule to the latest commit on the branch specified in the .gitmodules file.

```
git submodule update --remote --merge
```

# Conifuration

The buyer mock engine depends on configs to run. Different configs can be used to run buyer mock enigne for diffenent use cases.

Buyer mock engine can consume these configs in 2 differnt ways

## Local configs

- To use the configs from local, the config repo is used as a submodule inside the buyer mock engine repo and the configs are imported by the buyer mock engine.

- First initialize the submodule.

Follow initialization of submodule.

- Change the following env varaibales

```
    LOAD_LOCAL_CONFIG = true
    CONFIG_FILE_NAME = "fis_build.json"
```

- LOAD_LOCAL_CONFIG acts as a boolean flag and CONFIG_FILE_NAME can be found inside the config submodule's build folder.

## Github configs.

- To use github configs, the url of the raw file with configs is porvided to the buyer mock engine, and it fetches the data from it.

- Change the folllowing env vaiables.

```
    LOAD_LOCAL_CONFIG = false
    CONFIG_URL = "https://raw.githubusercontent.com/ONDC-Official/buyer-mock-config/master/build/fis_build.json"
```

- LOAD_LOCAL_CONFIG acts as a boolean flag

- The CONFIG_URL can be found by navigating to the file containing the config file inside build folder in the github repo.

- Click the raw button.

<img width="720" alt="Screenshot 2024-09-13 at 8 35 08 AM" src="https://github.com/user-attachments/assets/42f0606f-9b2c-47fb-b928-73fcb45b85ba">

- Now copy the url of the raw file.

# Steps to setup protocol servel in local environment

## Prerequisites

- Install node (https://nodejs.org/en)

## Steps to setup the local environment

Go to project root and install dependencies

```
npm i
```

add env variables including config json link from github

Command to run seller mock engine

```
npm start
```

# Run Seller mock engine with docker

Install Docker

```
https://docs.docker.com/engine/install/
```

Create docker build

```
docker build -t <tagname> .
```

Run docker build

```
docker run --env-file <env-path> -p <externalport : internalport> <image tag name>
```

sample build command

```
docker build -t seller-mock-engine:latest .
```

sample run command

```
docker run --env-file ./.env -p 4000:4000 seller-mock-engine:latest
```
