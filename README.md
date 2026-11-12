# musicboxd

Uma plataforma web responsiva para exploração, visualização e avaliação de álbuns de música populares.

**Feito Por**
João Lucas de Campos Gonçalves - Nº10
João Miguel Lima Faustino - Nº11

**Tecnologias Utilizadas**

* **HTML5**: Estruturação semântica da página.
* **Bootstrap 5.3.3**: Framework CSS utilizado para o grid responsivo, componentes e menu interativo via CDN.
* **CSS3 Customizado**: Estilizações personalizadas personalizadas em `src/styles/styles.css`.

**Funcionalidades**

* **Navegação Responsiva**: Barra de navegação flexível com menu colapsável para dispositivos móveis e gradiente personalizado.
* **Galeria de Álbuns**: Exibição em cards responsivos com capas, nomes dos álbuns, artistas e botões de chamada para avaliação.
* **Design Responsivo**: Adaptação automática para telas de celulares, tablets e computadores.
* **Catálogo compartilhado**: Álbuns e perfis de artistas são armazenados pelo servidor e as alterações administrativas exigem login.

**Estrutura do Projeto**

| Arquivo / Pasta | Descrição |
| :--- | :--- |
| `index.html` | Estrutura principal da página inicial |
| `src/styles/styles.css` | Folha de estilos customizada para botões e ajustes finos |
| `src/scripts/script.js` | Arquivo de funcionalidades de botões |
| `src/img/` | Diretório contendo as imagens das capas dos álbuns |

**Como Executar**

1. Faça o download ou clone este repositório em sua máquina.
2. Certifique-se de que a estrutura de arquivos e pastas (`src/styles/` e `src/img/`) seja mantida.
3. Configure `MUSICFY_ADMIN_PASSWORD` no ambiente do Windows com pelo menos 10 caracteres.
4. Inicie o site pelo arquivo `MUSICFY_web/iniciar-site.bat` e acesse o painel para criar ou editar álbuns e artistas.
5. Os dados compartilhados são armazenados em `musicfy-data/` ao lado da pasta `MUSICFY_web`. Faça backup dessa pasta para preservar o catálogo e os arquivos enviados.

Abrir `index.html` diretamente não inicia a API do servidor nem habilita o gerenciamento compartilhado do catálogo.