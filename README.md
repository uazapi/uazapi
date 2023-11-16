
# uazapi

https://uazapi.dev/


## Instalação automática

Atualizar o sistema e reiniciar servidor:

```bash
sudo apt update && sudo apt upgrade -y && sudo apt dist-upgrade -y && sudo apt install -y curl && echo "y" | sudo ufw enable && sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 8080/tcp && sudo ufw allow 443/tcp && reboot

```
Após  a reinicialização, execute o script:

```bash
sudo su
```

```bash
bash <(curl -s https://raw.githubusercontent.com/uazapi/uazapi/main/scripts/install.sh)
```

    
## Instalação passo a passo

1- Fazer update do sistema;

```bash
sudo apt update && sudo apt upgrade -y && sudo apt dist-upgrade -y && sudo apt install -y curl && reboot
```

2.1- Instalar dependência especial para ajustar envio de audio

```bash
sudo apt-get install ffmpeg -y
```

2.2- Instalar Redis

```bash
sudo apt-get install redis-server -y
```

2.3- habilitar o firewall, e liberar as porta 22, 80 e 443;

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
ufw allow 443/tcp
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
 curl -SLO https://deb.nodesource.com/nsolid_setup_deb.sh
```
```bash
 chmod 500 nsolid_setup_deb.sh
```
```bash
 ./nsolid_setup_deb.sh 20
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

```bash
cd scripts
```

```bash
docker-compose up -d
```

11- renomear arquivo modelo-env.yml para env.yml e editá-lo conforme suas necessidades, principalmente trocando a senha global, caso dê erro na hora de editar o arquivo, execute o comando:
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
apt install snapd -y
```
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

# Instalar Redis

```bash
sudo apt-get install redis-server -y
```
