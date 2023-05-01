
# uazapi

https://uazapi.dev/


## Instalação automática

Atualizar o sistema e reiniciar servidor:

```bash
sudo apt update && sudo apt upgrade -y && sudo apt dist-upgrade -y && sudo apt install -y curl && reboot
```
Após  a reinicialização, execute o script:

```bash
sudo su
```

```bash
bash <(curl -s https://raw.githubusercontent.com/uazapi/uazapi/main/install.sh)
```

    
## Instalação passo a passo


1- habilitar o firewall, e liberar as porta 22, 80, 8080 e 443;

```bash
sudo su
```
```bash
ufw enable
```
```bash
ufw allow 22/tcp
```

```bash
ufw allow 80/tcp
```

```bash
ufw allow 8080/tcp
```

```bash
ufw allow 443/tcp
```

2- Fazer update do sistema;

```bash
apt update && apt upgrade -y  && apt dist-upgrade -y
```

3- Setar o timezone;

```bash
dpkg-reconfigure tzdata
```
```bash
reboot
```

```bash
sudo su
```
4- instalar o node;

```bash
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
```
```bash
apt-get install -y nodejs
```

5- instalar o NPM;

```bash
npm install -g npm@latest
```

6- instalar o pm2;

```bash
npm i -g pm2
```

7- instalar docker;

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
```
```bash
sh get-docker.sh
```
```bash
usermod -aG docker ${USER}
```
```bash
apt-get install docker-compose
```

8- clonar esse repositório;

```bash
git clone https://github.com/uazapi/uazapi.git
```

9- instalar dependencias do repositório;
```bash
cd uazapi
```
```bash
npm i
```
10- instalar mongodb via docker 

  Verifique que no arquivo docker-compose-mongodb.yaml está setado uma senha para o mongo igual ao env-rename, caso queira trocar a senha, troque antes do comando abaixo, e não esqueça de trocar no arquivo .env) - caso dê erro de permissão na hora de editar rode o comando "sudo chmod -R 777 /home/ubuntu/uazapi".

```bash
docker-compose up -d
```
11- renomear arquivo dev-env.yml para env.yml e editá-lo conforme suas necessidades, principalmente trocando a senha global, caso dê erro na hora de editar o arquivo, execute o comando:
```bash
chmod -R 777 /home/ubuntu/uazapi
```
## Deploy

12- rodar a aplicação dentro da pasta uazapi (cd uazapi)
```bash
npm run start
```
Control+C para fechar a aplicação

13- Rodar aplicação via pm2, para que mesmo que o sistema dê reboot, continue rodando
```bash
pm2 start 'npm run start' --name uazapi
```
```bash
pm2 startup
```
```bash
pm2 save
```



# SSL - subdomínio

Adicione na cloudflare o subdomínio: 

subtipo: A

colocar ip VPS

desabilitar proxy

ttl: auto


```bash
snap install --classic certbot
```
```bash
certbot certonly --standalone
```
Não esqueça de alterar o env.yml para https e porta 443, e coloca o domínio na parte indicada.


# Forçar atualização da API e dependências

```bash
git fetch && git reset --hard && git pull && npm install --unsafe-perm
```

# Instalar dependência especial para ajustar envio de audio

```bash
sudo apt-get install ffmpeg -y
```
