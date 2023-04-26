const { exec } = require('child_process');
const fs = require('fs');

// Verifica se o FFmpeg está instalado
exec('command -v ffmpeg', (error, stdout, stderr) => {
  if (error) {
    // Instala o FFmpeg globalmente
    console.log('Instalando FFmpeg...');
    exec('sudo apt-get install ffmpeg -y', (installError, installStdout, installStderr) => {
      if (installError) {
        console.error('Erro ao instalar FFmpeg');
    //    process.exit(1);
      } else {
        console.log('FFmpeg instalado com sucesso');
        runApp();
      }
    });
  } else {
    console.log('FFmpeg já instalado');
    runApp();
  }
});

// Função para iniciar a aplicação
function runApp() {
  const { fork } = require('child_process');
  const app = fork('./src/main.js');
}