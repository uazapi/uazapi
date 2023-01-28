#!/bin/bash

# Enable firewall and open ports
sudo su
ufw enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 8080/tcp
ufw allow 443/tcp

# Update Linux packages
apt update && apt upgrade -y  && apt dist-upgrade -y

# Set timezone
dpkg-reconfigure tzdata

# Install Node.js
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get install -y nodejs

# Update NPM to latest version
npm install -g npm@latest

# Install PM2
npm i -g pm2

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ${USER}
apt-get install docker-compose

# Clone repository and install dependencies
git clone https://github.com/uazapi/uazapi.git
cd uazapi
npm i
sudo docker-compose-mongodb up -d
