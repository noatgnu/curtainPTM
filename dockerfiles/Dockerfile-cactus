FROM python:3.10-bullseye
LABEL maintainer="tphung001@dundee.ac.uk"

ARG BUILD_DATE
LABEL build-date=$BUILD_DATE

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV CACTUS docker
WORKDIR /app
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install git
RUN apt-get -y install nginx
RUN git clone https://github.com/noatgnu/cactus.git temp
RUN cp -R /app/temp /app/cactus
RUN sed -i 's/fil_config/#file_config/g' /app/cactus/cactus/handlers.py
RUN sed -i 's/#config_file_docker/file_config/g' /app/cactus/cactus/handlers.py
WORKDIR /app/cactus
RUN mkdir /app/cactus/db
RUN mkdir files
RUN mkdir /app/nginx
RUN touch /app/nginx/error.log
RUN touch /app/nginx/access.log
RUN cp nginx.docker.conf /etc/nginx/nginx.conf
RUN pip3 install -r requirements.txt
RUN alembic downgrade base
RUN alembic upgrade head
RUN apt-get -y install supervisor
RUN service supervisor stop
EXPOSE 8000
EXPOSE 8001
CMD ["bash", "/app/cactus/start.sh"]


