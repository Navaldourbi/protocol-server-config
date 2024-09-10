# Introduction

The Seller mock engine pulls latest config from github with github api and forms a structural logic to run seller ui or mock server, this ensures that the seller mock engine is running with latest configs.

The primary purpose of seller mock engine is to act as a business layer behind the protocol server.

# Repository Structure

- `/config` - stores configs in yamls if running local config
- `src` - contains all programming logic in typescript
- `logs` - logs output folder if enableLogging flag is true in env
- `package.json` - contains dependencies
- `tsconfig.json` - typescript configurations


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

