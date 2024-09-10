FROM node:16 
WORKDIR /app
COPY package.json .
COPY . . 
RUN npm install
RUN npm install ts-node -g
EXPOSE 4000
CMD ["npm","start"]
