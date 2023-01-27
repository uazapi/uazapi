#!/bin/sh

if [ "$DOCKER_ENV" = "true" ];
then
  echo "Enabling environment variables for Docker"
  echo "DOCKER_ENV=$DOCKER_ENV"
  echo
fi
echo
echo "> Starting application..."
echo
node -r dotenv/config ./dist/src/main.js
