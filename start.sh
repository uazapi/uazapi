#!/bin/bash

# Comando para atualizar o código e instalar as dependências do projeto
# git fetch && git reset --hard && git pull && npm install --unsafe-perm

# Verifica se o FFmpeg está instalado
if ! command -v ffmpeg &> /dev/null; then
  # Instala o FFmpeg globalmente
  echo -e "\e[7mInstalando FFmpeg...\e[0m"
  sudo apt-get install ffmpeg -y

  # Verifica se a instalação foi bem-sucedida
  if [ $? -ne 0 ]; then
    echo -e "\e[7mErro ao instalar FFmpeg\e[0m"
    exit 1
  fi
fi

# iniciar api - uazapi
node ./src/main.js