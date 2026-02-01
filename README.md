# VDH Simulator - Userscript

Um Userscript (script de usuário) para **Greasemonkey/Tampermonkey** que simula as funcionalidades principais do plugin *Video DownloadHelper*. Ele monitora o tráfego de rede e o DOM para identificar vídeos e streams, permitindo o download via linha de comando.

## 🚀 Funcionalidades

*   **🕵️ Monitoramento de Rede**: Intercepta requisições (`fetch`, `XHR`) para detectar vídeos (`.mp4`, `.webm`) e manifestos de streaming (`.m3u8`, `.mpd`).
*   **👀 Observer de DOM**: Detecta vídeos inseridos via tags `<video>`.
*   **📦 Integração com yt-dlp**: Gera comandos prontos para o **[yt-dlp](https://github.com/yt-dlp/yt-dlp)**, resolvendo problemas de:
    *   Erro 403 Forbidden (inclui automaticamente `Referer` e `User-Agent`).
    *   Streams fragmentados (HLS/DASH).
*   **🏷️ Detecção de Título** (Experimental): Tenta nomear o arquivo final com base no contexto da página.
*   **🎨 Interface Discreta**: Botão flutuante que notifica a quantidade de mídias detectadas.

## 🛠️ Pré-requisitos

Para que os comandos gerados funcionem, você precisa ter o **yt-dlp** instalado no seu computador. Ele é uma ferramenta de linha de comando poderosa para downloads.

*   **Linux**: `sudo apt install yt-dlp` ou `pip install yt-dlp`
*   **Windows/Mac**: Baixe em [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp#installation).

## 📥 Instalação do Script

1.  Instale uma extensão gerenciadora como **Violentmonkey** ou **Tampermonkey** no seu navegador.
2.  Crie um novo script.
3.  Copie e cole o conteúdo do arquivo [`vdh-simulator.user.js`](./vdh-simulator.user.js).
4.  Salve e habilite o script.

## 🎮 Como Usar

1.  Acesse uma página que contenha vídeos (ex: Hotmart, sites de streaming).
2.  O ícone 🎬 aparecerá no canto superior direito se mídias forem detectadas.
3.  Clique no ícone para ver a lista.
4.  Clique em **"Copy yt-dlp"**.
5.  Abra seu terminal e cole o comando.
    *   *Exemplo*: `yt-dlp "https://..." --referer "..." -o "video.mp4"`

## ⚠️ Limitações

*   **DRM**: Vídeos protegidos por DRM (Netflix, Prime Video, alguns cursos) não podem ser baixados por ferramentas comuns como esta.
*   **Nomes de Arquivo**: A detecção automática do nome do vídeo pode falhar em sites que não expõem o título claramente no DOM ou metadados. Nesses casos, o arquivo pode ser salvo com o nome genérico ou o nome do segmento.

## 📄 Licença

Este projeto é de código aberto e destinado a fins educacionais.
