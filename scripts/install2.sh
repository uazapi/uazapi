#!/bin/bash

# Caminho para o arquivo de bloqueio
LOCK_FILE="/root/meu_script_executado"

# Verifica se o script já foi executado
if [ -f "$LOCK_FILE" ]; then
    exit 0
fi

# Verifica se o usuário atual é o root
if [ "$EUID" -ne 0 ]; then
  echo -e "\e[7mEste script precisa ser executado com permissões de superusuário (root)\e[0m"
  exit
fi

# Ativa o firewall UFW e configura as regras de porta
ufw_status=$(sudo ufw status | grep -o "Status: active")
if [ "$ufw_status" != "Status: active" ]; then
    echo "y" | sudo ufw enable
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
else
    echo -e "\e[7mFirewall UFW já está ativo.\e[0m"
fi

# Atualiza o sistema e instala dependências básicas
echo -e "\e[7mAtualizando sistema e instalando dependências básicas...\e[0m"
sudo apt update && sudo apt upgrade -y && sudo apt dist-upgrade -y && sudo apt install -y curl

# Configura o fuso horário
sudo timedatectl set-timezone America/Sao_Paulo

# Instalando certbot
apt install snapd -y
snap install --classic certbot

# Verifica e instala Redis
if ! command -v redis-server &> /dev/null; then
    sudo apt install -y redis-server
else
    echo -e "\e[7mRedis já está instalado.\e[0m"
fi

# Verifica e instala FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    sudo apt-get install ffmpeg -y
else
    echo -e "\e[7mFFmpeg já está instalado.\e[0m"
fi

# Verifica e instala Node.js versão 20
node_version=$(node -v 2>/dev/null)
if [[ "$node_version" != v20* ]]; then
    curl -SLO https://deb.nodesource.com/nsolid_setup_deb.sh
    chmod 500 nsolid_setup_deb.sh
    ./nsolid_setup_deb.sh 20
    sudo apt-get install -y nodejs
else
    echo -e "\e[7mNode.js versão 20.x.x já está instalado.\e[0m"
fi

# Instala a última versão do NPM
sudo npm install -g npm@latest

# Instala PM2
if ! command -v pm2 &> /dev/null; then
    sudo npm i -g pm2
else
    echo -e "\e[7mPM2 já está instalado.\e[0m"
fi

# Verifica e instala Docker e Docker Compose
if ! command -v docker &> /dev/null && ! command -v docker-compose &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ${USER}
    sudo apt-get install -y docker-compose
else
    echo -e "\e[7mDocker e Docker Compose já estão instalados.\e[0m"
fi

# Atualiza ou clona o repositório do aplicativo
if [ -d "/root/uazapi" ]; then
    cd /root/uazapi
    sudo git pull origin main
else
    sudo git clone https://github.com/uazapi/uazapi.git /root/uazapi
    cd /root/uazapi
    chmod -R 777 .
    mv modelo-env.yml env.yml
fi


# Instala as dependências do Node.js
sudo npm install

# Verifica e inicia Docker Compose
if ! sudo docker ps --filter "name=mongodb" | grep -q mongodb; then
    cd mongodb
    sudo docker-compose up -d
    cd ..
else
    echo -e "\e[7mContainer mongodb já está em execução.\e[0m"
fi

# Configura PM2
if ! sudo pm2 list | grep -q uazapi; then
    CURRENT_DIR=$(pwd)
    sudo chown -R $USER:$(id -gn $USER) $CURRENT_DIR/uazapi
    sudo pm2 start 'npm run start' --name uazapi
    sudo pm2 startup
    sudo pm2 save
else
    echo -e "\e[7mO processo uazapi já está em execução no PM2.\e[0m"
fi

# Mensagem de conclusão
echo -e "\e[7mInstalação concluída com sucesso!\e[0m"
echo -e "\e[7mA sua global apikey está dentro do arquivo env.yml,\e[0m"
echo -e "\e[7mAconselhamos modifica-la, use um gerador de senha aleatória, sem caracteres especiais, com tamanho de 40 a 50 caracteres,\e[0m"
echo -e "\e[7mapós modificar a sua global api key, você precisa reiniciar a API pelo PM2, para isso, execute o seguinte comando:\e[0m"
echo -e "\e[7mpm2 restart uazapi\e[0m"

# Cria um arquivo de bloqueio após a execução
touch "$LOCK_FILE"