#!/bin/bash


# Verifica se o usuário atual é o root
if [ "$EUID" -ne 0 ]
  then echo "Este script precisa ser executado com permissões de superusuário (root)"
  exit
fi


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

# Verifica se o Node.js e NPM já foram instalados
if ! command -v node &> /dev/null; then
    # Instala o Node.js e o gerenciador de pacotes NPM
    curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Verifica se o comando anterior foi executado corretamente
    if [ $? -ne 0 ]; then
        echo "Erro ao instalar Node.js e NPM"
        exit 1
    fi
else
    echo "Node.js e NPM já estão instalados, pulando para próxima etapa"
fi

# Mensagem de status
echo "Instalando a última versão do NPM..."

# Verifica se o NPM já foi instalado
if ! command -v npm &> /dev/null; then
    # Instala a última versão do NPM
    sudo npm install -g npm@latest

    # Verifica se o comando anterior foi executado corretamente
    if [ $? -ne 0 ]; then
        echo "Erro ao instalar NPM"
        exit 1
    fi
else
    echo "NPM já está instalado, pulando para próxima etapa"
fi

# Mensagem de status
echo "Instalando PM2..."

# Verifica se o PM2 já foi instalado
if ! command -v pm2 &> /dev/null; then
    # Instala o PM2 para gerenciar o aplicativo Node.js
    sudo npm i -g pm2

    # Verifica se o comando anterior foi executado corretamente
    if [ $? -ne 0 ]; then
        echo "Erro ao instalar PM2"
        exit 1
    fi
else
    echo "PM2 já está instalado, pulando para próxima etapa"
fi

# Mensagem de status
echo "Instalando Docker e Docker Compose..."

# Verifica se o Docker e Docker Compose já foram instalados
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
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
else
    echo "Docker e Docker Compose já estão instalados, pulando para próxima etapa"
fi


# Mensagem de status
echo "Clonando repositório do aplicativo..."

# Verifica se o repositório já foi clonado
if [ ! -d "uazapi" ]; then
  sudo git clone https://github.com/uazapi/uazapi.git
  cd uazapi
  mv dev-env.yml env.yml

  # Verifica se o comando anterior foi executado corretamente
  if [ $? -ne 0 ]; then
    echo "Erro ao clonar repositório do aplicativo"
    exit 1
  fi
else
  echo "Repositório do aplicativo já clonado, pulando etapa..."
fi

# Verifica se o container "mongodb" já está em execução
if sudo docker ps --filter "name=mongodb" | grep -q mongodb; then
  echo "O container mongodb já está em execução"
else
  # Mensagem de status
  echo "Iniciando Docker Compose..."
  
  sudo docker-compose up -d
  
  # Verifica se o comando anterior foi executado corretamente
  if [ $? -ne 0 ]; then
    echo "Erro ao iniciar Docker Compose"
    exit 1
  fi
fi


# Mensagem de status
echo "Configurando PM2..."

# Permite que o usuário atual gerencie o aplicativo com PM2
CURRENT_DIR=$(pwd)
sudo chown -R $USER:$(id -gn $USER) $CURRENT_DIR/uazapi

# Verifica se o processo uazapi já está em execução no PM2
if sudo pm2 list | grep -q uazapi; then
  echo "O processo uazapi já está em execução no PM2"
else
  sudo pm2 start 'npm run start' --name uazapi
  sudo pm2 startup
  sudo pm2 save

  # Verifica se o comando anterior foi executado corretamente
  if [ $? -ne 0 ]; then
    echo "Erro ao configurar PM2"
    exit 1
  fi
fi


#Mensagem de conclusão
echo "Instalação concluída com sucesso!"
echo "A sua global apikey está dentro do arquivo env.yml,"
echo "Aconselhamos modifica-la, use um gerador de senha aleatória, sem caracteres especiais, com tamanho de 30 a 40 caracteres, "
echo "após modificar a sua global api key, você precisa reiniciar a API pelo PM2, para isso, execute o seguinte comando:"
echo "pm2 restart uazapi"






