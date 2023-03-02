#!/bin/bash


# Verifica se o usuário atual é o root
if [ "$EUID" -ne 0 ]
  then echo -e "\e[7mEste script precisa ser executado com permissões de superusuário (root)\e[0m"
  exit
fi


# Mensagem de status
echo -e "\e[7mHabilitando firewall UFW...\e[0m"


# Ativa o firewall UFW e configura as regras de porta
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 443/tcp


# Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
  echo -e "\e[7mErro ao habilitar firewall UFW\e[0m"
  exit 1
fi


# Mensagem de status
echo -e "\e[7mAtualizando sistema e instalando dependências básicas...\e[0m"


# Atualiza o sistema e instala dependências básicas
sudo apt update && sudo apt upgrade -y && sudo apt dist-upgrade -y && sudo apt install -y curl


# Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
  echo -e "\e[7mErro ao atualizar sistema e instalar dependências básicas\e[0m"
  exit 1
fi


# Mensagem de status
echo -e "\e[7mConfigurando o fuso horário...\e[0m"


# Configura o fuso horário
sudo timedatectl set-timezone America/Sao_Paulo


# Mensagem de status
echo -e "\e[7mVerificando se o Node.js está instalado...\e[0m"

# Verifica se o Node.js já foi instalado e se está na versão 16.x.x
if ! command -v node &> /dev/null || [[ $(node -v) != v16* ]]; then
    # Instala o Node.js e o gerenciador de pacotes NPM
    curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Verifica se o comando anterior foi executado corretamente
    if [ $? -ne 0 ]; then
        echo -e "\e[7mErro ao instalar Node.js\e[0m"
        exit 1
    fi
else
    echo -e "\e[7mNode.js já está instalado na versão 16.x.x\e[0m"
fi

# Mensagem de status
echo -e "\e[7mInstalando a última versão do NPM...\e[0m"

# Instala a última versão do NPM
sudo npm install -g npm@latest

# Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
        echo -e "\e[7mErro ao instalar NPM\e[0m"
        exit 1
fi



# Mensagem de status
echo -e "\e[7mInstalando PM2...\e[0m"

# Instala o PM2 para gerenciar o aplicativo Node.js
sudo npm i -g pm2

# Verifica se o comando anterior foi executado corretamente
if [ $? -ne 0 ]; then
    echo -e "\e[7mErro ao instalar PM2\e[0m"
    exit 1
fi

# Mensagem de status
echo -e "\e[7mInstalando Docker e Docker Compose...\e[0m"

# Verifica se o Docker e Docker Compose já foram instalados
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    # Instala o Docker e o Docker Compose
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ${USER}
    sudo apt-get install -y docker-compose

    # Verifica se o comando anterior foi executado corretamente
    if [ $? -ne 0 ]; then
        echo -e "\e[7mErro ao instalar Docker e Docker Compose\e[0m"
        exit 1
    fi
else
    echo -e "\e[7mDocker e Docker Compose já estão instalados, pulando para próxima etapa\e[0m"
fi


# Mensagem de status
echo -e "\e[7mClonando repositório do aplicativo...\e[0m"

# Verifica se o repositório já foi clonado
if [ ! -d "uazapi" ]; then
  sudo git clone https://github.com/uazapi/uazapi.git
  cd uazapi
  mv dev-env.yml env.yml

  # Verifica se o comando anterior foi executado corretamente
  if [ $? -ne 0 ]; then
    echo -e "\e[7mErro ao clonar repositório do aplicativo\e[0m"
    exit 1
  fi
else
  echo -e "\e[7mRepositório do aplicativo já clonado, pulando etapa...\e[0m"
fi

# Verifica se o container "mongodb" já está em execução
if sudo docker ps --filter "name=mongodb" | grep -q mongodb; then
  echo -e "\e[7mO container mongodb já está em execução\e[0m"
else
  # Mensagem de status
  echo -e "\e[7mIniciando Docker Compose...\e[0m"
  
  sudo docker-compose up -d
  
  # Verifica se o comando anterior foi executado corretamente
  if [ $? -ne 0 ]; then
    echo -e "\e[7mErro ao iniciar Docker Compose\e[0m"
    exit 1
  fi
fi


# Mensagem de status
echo -e "\e[7mConfigurando PM2...\e[0m"

# Permite que o usuário atual gerencie o aplicativo com PM2
CURRENT_DIR=$(pwd)
sudo chown -R $USER:$(id -gn $USER) $CURRENT_DIR/uazapi

# Verifica se o processo uazapi já está em execução no PM2
if sudo pm2 list | grep -q uazapi; then
  echo -e "\e[7mO processo uazapi já está em execução no PM2\e[0m"
else
  sudo pm2 start 'npm run start' --name uazapi
  sudo pm2 startup
  sudo pm2 save

  # Verifica se o comando anterior foi executado corretamente
  if [ $? -ne 0 ]; then
    echo -e "\e[7mErro ao configurar PM2\e[0m"
    exit 1
  fi
fi


#Mensagem de conclusão
echo -e "\e[7mInstalação concluída com sucesso!\e[0m"
echo -e "\e[7mA sua global apikey está dentro do arquivo env.yml,\e[0m"
echo -e "\e[7mAconselhamos modifica-la, use um gerador de senha aleatória, sem caracteres especiais, com tamanho de 30 a 40 caracteres,\e[0m"
echo -e "\e[7mapós modificar a sua global api key, você precisa reiniciar a API pelo PM2, para isso, execute o seguinte comando:\e[0m"
echo -e "\e[7mpm2 restart uazapi\e[0m"






