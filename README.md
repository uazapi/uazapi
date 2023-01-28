
# uazapi






## Instalação Rápida

para instalar automaticamente execute o comando abaixo, recomendo não usar a instalção rápida pois o script ainda não foi testado, pule para instalação passo a passo.

```bash
  sudo su
```

```bash
  curl -sL https://raw.githubusercontent.com/uazapi/uazapi/master/install.sh | bash
```

O arquivo bash irá :

1- habilitar o firewall, e liberar as porta 22, 80, 8080 e 443;

2- Fazer update do sistema;

3- Setar o timezone;

4- instalar o node;

5- instalar o NPM;

6- instalar o pm2;

7- instalar docker;

8- clonar esse repositório;

9- instalar dependencias do repositório;
    
## Instalação passo a passo

Se você não fez a instalação automática, te ensino a fazer passo a passo, para customizar algum passo.


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
  docker-compose-mongodb up -d
```
11- renomear arquivo .env-rename para .env e editá-lo conforme suas necessidades, principalmente trocando a senha global, caso dê erro na hora de editar o arquivo, execute o comando:
```bash
  chmod -R 777 /home/ubuntu/uazapi
```
## Deploy

12- rodar a aplicação dentro da pasta uazapi (cd uazapi)
```bash
  npm run start
```

13- Rodar aplicação via pm2, para que mesmo que o sistema dê reboot, continue rodando
```bash
  pm2 start npm run start
```
```bash
  pm2 startup
```
```bash
  pm2 save
```


```bash
  npm run start
```

Para manter rodando mesmo reiniciando execute:


```bash
  pm2 start npm run start
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
Não esqueça de alterar o .env para https e porta 443, e coloca o domínio em "DOMAIN".


#Atualizar API

```bash
  git pull
```



