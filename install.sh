#!/bin/bash


# Mensagem de status
echo "Habilitando firewall UFW..."


# Ativa o firewall UFW e configura as regras de porta
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 443/tcp


# Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
  echo "Erro ao habilitar firewall UFW"
  exit 1
fi


# Mensagem de status
echo "Atualizando sistema e instalando dependências básicas..."


# Atualiza o sistema e instala dependências básicas
sudo apt update && sudo apt upgrade -y && sudo apt dist-upgrade -y && sudo apt install -y curl


# Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
  echo "Erro ao atualizar sistema e instalar dependências básicas"
  exit 1
fi


# Mensagem de status
echo "Configurando o fuso horário..."


# Configura o fuso horário
sudo timedatectl set-timezone America/Sao_Paulo


# Mensagem de status
echo "Instalando Node.js e NPM..."


# Instala o Node.js e o gerenciador de pacotes NPM
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs


# Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
  echo "Erro ao instalar Node.js e NPM"
  exit 1
fi


# Mensagem de status
echo "Instalando a última versão do NPM..."


# Instala a última versão do NPM
sudo npm install -g npm@latest


# Mensagem de status
echo "Instalando PM2..."


# Instala o PM2 para gerenciar o aplicativo Node.js
sudo npm i -g pm2


# Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
  echo "Erro ao instalar PM2"
  exit 1
fi


# Mensagem de status
echo "Instalando Docker e Docker Compose..."


# Instala o Docker e o Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ${USER}
sudo apt-get install -y docker-compose


# Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
  echo "Erro ao instalar Docker e Docker Compose"
  exit 1
fi


# Mensagem de status
echo "Clonando repositório do aplicativo..."


# Clona o repositório do aplicativo e inicia o Docker Compose
CURRENT_DIR=$(pwd)
sudo git clone https://github.com/uazapi/uazapi.git
cd uazapi
sudo npm i


# Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
  echo "Erro ao clonar repositório do aplicativo"
  exit 1
fi


# Mensagem de status
echo "Iniciando Docker Compose..."


sudo docker-compose up -d


#Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
echo "Erro ao iniciar Docker Compose"
exit 1
fi


#Mensagem de status
echo "Configurando PM2..."


#Permite que o usuário atual gerencie o aplicativo com PM2
CURRENT_DIR=$(pwd)
sudo chown -R $USER:$(id -gn $USER) $CURRENT_DIR/uazapi
sudo pm2 start 'npm run start' --name uazapi
sudo pm2 startup
sudo pm2 save


#Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
echo "Erro ao configurar PM2"
exit 1
fi


#Mensagem de conclusão
echo "Instalação concluída com sucesso!"







