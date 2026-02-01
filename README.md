# VDH Simulator - Greasemonkey Script

Este projeto é um script de usuário (Userscript) para Greasemonkey/Tampermonkey que simula a funcionalidade básica do plugin **Video DownloadHelper (VDH)**.

## Funcionalidades

*   **Monitoramento de Rede**: Intercepta requisições `fetch` e `XHR` para identificar arquivos de mídia (MP4, WEBM) e manifestos de streaming (HLS .m3u8, DASH .mpd).
*   **Observação do DOM**: Detecta automaticamente tags `<video>` presentes ou injetadas na página.
*   **Interface Flutuante**: Exibe um ícone discreto no canto da tela que indica quantos vídeos foram detectados.
*   **Ações de Download**:
    *   **Arquivos simples**: Oferece link direto para download.
    *   **Streams (HLS/DASH)**: Gera e copia para a área de transferência o comando `ffmpeg` necessário para baixar e converter o vídeo.

## Instalação

1.  Tenha uma extensão de gerenciamento de userscripts instalada (ex: [Violentmonkey](https://violentmonkey.github.io/), [Tampermonkey](https://www.tampermonkey.net/)).
2.  Crie um novo script na extensão.
3.  Copie o conteúdo do arquivo [`vdh-simulator.user.js`](./vdh-simulator.user.js) e cole no editor da extensão.
4.  Salve e ative o script.

## Como Testar

1.  Abra o arquivo [`test-page.html`](./test-page.html) no seu navegador.
2.  Verifique se o ícone do VDH (🎬) aparece no canto superior direito.
3.  Interaja com a página:
    *   O vídeo embutido deve ser detectado automaticamente.
    *   Clique nos botões "Simulate HLS" ou "Simulate DASH".
4.  O contador vermelho (badge) deve incrementar.
5.  Clique no ícone para ver a lista de vídeos e testar os botões de ação ("Download" ou "Copy FFmpeg").

## Estrutura do Projeto

*   `vdh-simulator.user.js`: O código fonte principal do script.
*   `test-page.html`: Página para validar o funcionamento do script.
