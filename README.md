# VDH Simulator - Userscript

Um Userscript (script de usuário) para **Greasemonkey/Tampermonkey** que simula as funcionalidades principais do plugin *Video DownloadHelper*. Ele monitora o tráfego de rede e o DOM para identificar vídeos e streams, permitindo o download via linha de comando.

## 🚀 Funcionalidades

*   **🕵️ Monitoramento de Rede**: Intercepta requisições (`fetch`, `XHR`) para detectar vídeos (`.mp4`, `.webm`) e manifestos de streaming (`.m3u8`, `.mpd`).
*   **👀 Observer de DOM**: Detecta vídeos inseridos via tags `<video>`.
*   **� Suporte Híbrido Avançado**:
    *   **YouTube**: Detecção nativa com correção para navegação SPA (Single Page Application) e botões dedicados de qualidade (Melhor, 720p).
    *   **Hotmart/Outros**: Interceptação robusta de rede que injeta automaticamente `Referer`, `User-Agent` e `Cookies` no comando, prevenindo erros 403 sem depender de arquivos locais.
*   **📦 Integração com yt-dlp**: Gera comandos prontos para copiar e colar no terminal.
*   **🎵 Extração de Áudio**: Botão dedicado para baixar apenas o áudio (MP3) de qualquer vídeo detectado (com parâmetros otimizados para YouTube).
*   **🏷️ Detecção de Título** (Experimental): Tenta nomear o arquivo final com base no contexto da página.
*   **🎨 Interface Discreta**: Botão flutuante que notifica a quantidade de mídias detectadas.

## 🛠️ Pré-requisitos

1.  **Tampermonkey**: Instale a extensão no seu navegador ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) | [Firefox](https://addons.mozilla.org/pt-BR/firefox/addon/tampermonkey/)).
2.  **yt-dlp**: Ferramenta de linha de comando essencial.
    *   *Linux*: `sudo apt install yt-dlp` ou `pip install yt-dlp`
    *   *Windows*: Baixe o `.exe` do [GitHub oficial](https://github.com/yt-dlp/yt-dlp).

## 📥 Instalação do Script

1.  Crie um novo script no Tampermonkey.
2.  Copie o conteúdo do arquivo [`vdh-simulator.user.js`](./vdh-simulator.user.js) deste repositório.
3.  Cole no editor do Tampermonkey e salve (Ctrl+S).

## 🎮 Como Usar

1.  Acesse uma página que contenha vídeos (ex: Hotmart, sites de streaming).
2.  O botão **🎬** aparecerá no canto superior direito se mídias forem detectadas.
3.  Clique no ícone para ver a lista.
4.  Escolha a ação desejada:
    *   **YouTube**:
        *   `yt-dlp (Melhor)`: Baixa a melhor qualidade possível.
        *   `Áudio (MP3)`: Extrai apenas o áudio.
        *   `720p`: Limita a qualidade para economizar espaço.
    *   **Hotmart/Genérico**:
        *   `Copy yt-dlp`: Gera o comando robusto com todos os headers necessários.
        *   `Copy Audio`: Gera o comando para extrair áudio com os headers injetados.
5.  Abra seu terminal e cole o comando.
    *   *Exemplo*: `yt-dlp "https://..." --referer "..." --add-header "Cookie:..." -o "video.mp4"`

## ⚠️ Limitações

*   **DRM**: Vídeos protegidos por DRM (Netflix, Prime Video, alguns cursos) não podem ser baixados por ferramentas comuns como esta.
*   **Nomes de Arquivo**: A detecção automática do nome do vídeo pode falhar em sites que não expõem o título claramente no DOM ou metadados. Nesses casos, o arquivo pode ser salvo com o nome genérico ou o nome do segmento.

## 📄 Licença

Este projeto é de código aberto e destinado a fins educacionais.
