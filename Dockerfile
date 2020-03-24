FROM node:alpine

RUN mkdir /mqtt
RUN mkdir /mqtt/config
WORKDIR /mqtt

ADD package.json /mqtt/
RUN npm install

COPY mqttalerter.js /mqtt

ADD ./config/config.json /mqtt/config/
ADD ./config/config.json /mqtt/config.json.org
ADD VERSION .
ADD Dockerfile .
ADD build_container.sh .

CMD [ "npm", "start" ]
