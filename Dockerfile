FROM node:16-bullseye-slim
LABEL maintainer="tphung001@dundee.ac.uk"

ARG BUILD_DATE
LABEL build-date=$BUILD_DATE

EXPOSE 80
WORKDIR /app
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install git
RUN apt-get -y install nginx

RUN git clone https://github.com/noatgnu/curtainptm.git
WORKDIR /app/curtainptm
RUN mkdir /app/nginx
RUN touch /app/nginx/error.log
RUN touch /app/nginx/access.log
RUN cp nginx.conf /etc/nginx/nginx.conf
RUN npm install
RUN service nginx stop
RUN node_modules/.bin/ng build
RUN node_modules/.bin/ng build -c=docker
CMD ["bash", "/app/curtainptm/start.sh"]
