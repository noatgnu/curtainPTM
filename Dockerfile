FROM node:18-bullseye-slim
LABEL maintainer="tphung001@dundee.ac.uk"

ARG BUILD_DATE
ARG API_HOST=https://celsus.muttsu.xyz/
ARG ORCID_APPID=APP-5RXLC3W1MS2MOW0F
LABEL build-date=$BUILD_DATE

WORKDIR /app
RUN apt-get -y update
RUN apt-get -y upgrade

RUN apt-get -y install git
RUN apt-get -y install nginx

RUN git clone https://github.com/noatgnu/curtainPTM.git
WORKDIR /app/curtainPTM
RUN sed -i -r "s|https://celsus.muttsu.xyz/|${API_HOST}|" ./src/environments/environment.prod.ts
RUN sed -i -r "s|APP-5RXLC3W1MS2MOW0F|${ORCID_APPID}|" ./src/environments/environment.prod.ts
#RUN npm -g config set user root
RUN npm install --quiet --no-progress -g @angular/cli@14
RUN npm install
RUN node_modules/.bin/ng build

FROM nginx:latest

COPY --from=0 /app/curtainPTM/dist /usr/share/nginx/html

EXPOSE 80


