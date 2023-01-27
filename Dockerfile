FROM node:16.17.0

LABEL version="2.0.0" description="Api to control whatsapp features through http requests." 
LABEL maintainer="uazapi" git="https://uazapi.com"
LABEL contact="suporte@uazapi.com"

RUN apt-get update -y
RUN apt-get upgrade -y

WORKDIR /home/Projects

COPY ./package.json .

# Set "true" to dynamically insert environment variables as described in the "./dev.env" file
ENV DOCKER_ENV=false

RUN npm i

COPY . .


EXPOSE 8080

CMD [ "npm", "run", "start:prod" ]
