# Automacao SPA sem instalacao

Esta versao roda dentro do proprio navegador, sem instalar Python, Playwright, extensao ou executavel.

Use esta opcao quando o computador tiver bloqueio de instalacao.

## Como rodar

1. Abra o SPA normalmente no Edge ou Chrome.
2. Entre na caixa `Processo Judicial - CDSP`.
3. Garanta que esta na fase/setor correto.
4. Aperte `F12` ou `Ctrl + Shift + I`.
5. Abra a aba `Console`.
6. Abra o arquivo `spa_sem_instalacao_console.js`.
7. Copie todo o conteudo do arquivo.
8. Cole no Console do navegador e aperte `Enter`.

Um painel chamado `Automacao SPA CDSP` vai aparecer no canto inferior direito da pagina.

O painel tem o botao `Ocultar`. Ao clicar nele, o menu fica recolhido como uma barra pequena na pagina. Para abrir novamente, clique em `Abrir` ou na propria barra do painel. Essa preferencia fica salva no navegador.

## Abrir o menu sem Console

Use esta opcao para abrir o painel sem copiar codigo e sem abrir o Console.

Arquivo:

```text
abrir_menu_spa.cmd
```

Como usar:

1. Feche a janela antiga do Edge usada para o SPA, se ela estiver aberta sem o menu.
2. De dois cliques em `abrir_menu_spa.cmd`.
3. O script abrira o Edge em um perfil separado chamado `browser-profile-menu`.
4. Na primeira vez, faca login no Google normalmente.
5. Quando a tela do SPA carregar, o painel `Automacao SPA CDSP` sera injetado automaticamente.

Depois disso, quando precisar abrir o menu de novo, de dois cliques em `abrir_menu_spa.cmd`.

Observacoes:

- esse modo nao instala programa novo;
- ele usa o Edge/Chrome que ja existe no computador;
- por padrao ele detecta o navegador automaticamente, usando o navegador padrao do Windows quando possivel;
- por usar perfil separado, o primeiro login pode precisar ser feito novamente;
- se a politica da PGE bloquear porta de depuracao local do navegador, use o modo `Snippets`.

### Versao portatil

Se quiser levar somente um lancador, sem depender do arquivo `spa_sem_instalacao_console.js`, use:

```text
abrir_menu_spa_portatil.cmd
```

Ele chama o arquivo `abrir_menu_spa_portatil.ps1`, que ja contem uma copia embutida do menu. Se o `config.json` nao estiver junto, ele usa a URL padrao da caixa CDSP.

Na pratica:

- `abrir_menu_spa.cmd`: usa o script `spa_sem_instalacao_console.js` que estiver na pasta;
- `abrir_menu_spa_portatil.cmd`: usa o menu embutido e nao precisa do `.js`.

Se o menu for atualizado, gere/atualize novamente a versao portatil para ela receber as mudancas.

## Atalho por Snippets

O navegador apaga qualquer script colado no Console quando a aba e recarregada com `F5`, `Ctrl + R` ou pelo botao de recarregar. Como o favorito com `javascript:` foi bloqueado nesse ambiente, use `Snippets` do DevTools.

### Criar o snippet uma vez

1. Abra o SPA normalmente.
2. Aperte `F12` ou `Ctrl + Shift + I`.
3. Abra a aba `Sources` ou `Fontes`.
4. No painel lateral, procure `Snippets`.
5. Clique em `New snippet` ou `Novo snippet`.
6. Nomeie como `Automacao SPA CDSP`.
7. Cole todo o conteudo de `spa_sem_instalacao_console.js`.
8. Aperte `Ctrl + S` para salvar.

### Rodar depois de recarregar

1. Abra ou recarregue o SPA.
2. Aperte `F12` ou `Ctrl + Shift + I`.
3. Va em `Sources` ou `Fontes`.
4. Abra `Snippets`.
5. Clique no snippet `Automacao SPA CDSP`.
6. Aperte `Ctrl + Enter` para executar.

O painel deve aparecer no canto inferior direito da pagina. Assim voce nao precisa copiar e colar o codigo inteiro novamente.

Quando o arquivo `spa_sem_instalacao_console.js` for atualizado, abra o snippet salvo, substitua o conteudo pelo novo arquivo e salve com `Ctrl + S`.

## Filtrar por data

O painel agora tem a opcao:

```text
Filtrar data
```

Marque essa opcao e escolha a data antes de rodar os botoes de ciencia ou de abertura de abas.

O script tenta aplicar o filtro nativo da coluna `Data da Distribuicao`. Se nao encontrar o filtro nativo, ele percorre a tabela e ignora as linhas que nao tiverem aquela data.

A data escolhida fica salva no navegador. Depois de recarregar a pagina e colar o script novamente, o painel tende a recuperar a mesma data.

## Quantidade de processos

O painel tem o campo:

```text
Quantidade
```

Use esse campo para limitar qualquer acao do painel.

Agora a quantidade conta pelo `Numero do Processo`, e nao pela quantidade de pendencias/linhas abertas.
Se o mesmo numero de processo tiver 2 pendencias, o script abre ou processa as 2, mas consome somente `1` da quantidade.

Exemplos:

- `5` + `Dar ciencia`: da ciencia em ate 5 processos;
- `5` + `Abrir abas`: abre pendencia e expedientes de ate 5 processos;
- `5` + `Encerrar marcados`: encerra ate 5 processos marcados;
- vazio ou `0`: processa tudo que estiver disponivel na lista/paginacao.

## Filtros condicionais

O painel tem duas secoes recolhiveis:

```text
Filtros de origem
Filtro de prazo
```

Se nenhum filtro estiver marcado, as acoes continuam sendo aplicadas para tudo.

Em `Filtros de origem`, voce pode marcar:

- `Processos de 1o Grau`;
- `Processos de 2o Grau`;
- `Jurisdicao contem CEJUSC`.

Os filtros de 1o e 2o grau usam a coluna `Tribunal` e tambem o texto do grupo quando a caixa estiver agrupada por Tribunal. O filtro de CEJUSC usa a coluna `Jurisdicao`.

Em `Filtro de prazo`, voce pode marcar uma ou mais opcoes:

- `Azul - prazo longo`;
- `Amarelo - prazo curto`;
- `Vermelho - atrasado`;
- `Sem prazo`.

Se nenhuma opcao de prazo estiver marcada, o script considera todos os prazos.

O filtro de prazo usa primeiro a cor/classe que o proprio SPA renderiza. Para prazo vermelho, tambem ha uma verificacao pela data do prazo quando a data esta disponivel no HTML.

## Ordem recomendada

```text
Dar ciencia
```

Depois confira se as ciencias foram dadas corretamente.

Clique em:

```text
Atualizar lista
```

Esse botao atualiza somente a tabela interna do SPA, sem recarregar a aba inteira. Assim o painel continua carregado e voce nao precisa colar o script novamente.

Depois clique:

```text
Abrir abas
```

A ordem esperada das abas e:

```text
Processo 1 - Pendencia
Processo 1 - Expediente(s)
Processo 2 - Pendencia
Processo 2 - Expediente(s)
```

## Execucao completa

Quando a conferencia estiver correta:

1. deixe `Quantidade` vazia ou `0`;
2. rode `Dar ciencia`;
3. espere terminar;
4. clique em `Atualizar lista`;
5. rode `Abrir abas`.

Se voce usar `F5`, `Ctrl + R` ou o botao de recarregar do navegador, o navegador apaga qualquer script colado no Console. Nesse caso, sera necessario colar o script novamente.

## Abrir processos duplicados

Use quando a caixa estiver agrupada por `Numero do Processo`.

O script procura os grupos que aparecem com contador azul maior que `1`, expande cada grupo e abre somente os processos dentro desses grupos. Para cada processo, ele abre primeiro a pendencia e depois todos os expedientes encontrados.

Com `Quantidade` vazia ou `0`, ele percorre todos os grupos duplicados da paginacao. Com `Quantidade` preenchida, ele para quando atingir essa quantidade de numeros de processo abertos. Um grupo duplicado com 2 pendencias conta como `1` processo.

Botao:

```text
Abrir duplicados
```

## Encerramento em massa com marcador

Use esta funcao somente depois de filtrar ou conferir que os processos corretos estao com o marcador `Encerrar` no SPA.

O script faz uma trava adicional: ele so tenta encerrar linhas que tenham marcador com texto `ENCERRAR` e que tambem possuam a opcao `Sugerir encerramento de tarefa` no menu de proximo passo.

Ordem recomendada:

1. coloque uma quantidade pequena, como `5`, se quiser conferir primeiro;
2. rode `Encerrar marcados`;
3. confira se os processos certos foram enviados para `Sugerir encerramento de tarefa`;
4. se estiver tudo correto, deixe `Quantidade` vazia ou `0` e rode `Encerrar marcados` novamente.

Se a janela de encerramento abrir, mas o botao `Salvar` nao for encontrado ou a janela nao fechar depois de salvar, o script para a execucao e registra o erro no painel.

## Pop-ups bloqueados

Se o navegador bloquear as abas, autorize pop-ups para:

```text
spa.pge.mt.gov.br
```

Sem essa permissao, o navegador pode impedir que o script abra muitas abas.

## Limitacoes desta versao

Esta versao nao instala nada, mas depende do navegador permitir abertura de abas por script.

Se a PGE bloquear pop-ups ou DevTools, a alternativa sera usar uma ferramenta ja homologada no ambiente, como Power Automate Desktop, Selenium corporativo ou uma autorizacao de TI para executar o pacote Python.

## O que o script faz

- altera a paginacao para 100;
- intercepta `confirm()` para aceitar a ciencia automaticamente;
- clica em `form.take-consciousness-btn`;
- atualiza a lista do SPA sem recarregar a aba inteira, quando usado o botao `Atualizar lista`;
- conta a `Quantidade` por `Numero do Processo`, abrindo/processando todas as pendencias do mesmo numero;
- aplica filtros condicionais de Tribunal, Jurisdicao/CEJUSC e Prazo quando eles estiverem marcados;
- abre pendencia usando a URL interna do DataTables quando disponivel;
- abre expedientes por `a[data-original-title^="Ler Expediente"]`;
- abre apenas grupos duplicados quando o contador azul do grupo e maior que `1`;
- encerra somente processos com marcador `ENCERRAR`, usando `Sugerir encerramento de tarefa` e `Salvar`;
- percorre a paginacao ate a ultima pagina.
