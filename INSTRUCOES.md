# Sistema de Revenda de Cosméticos

## 🆕 Atualização — Parte 5 (visual roxo/rosa, fotos e gráficos)

Essa entrega traz o que você pediu depois de ver os dois modelos de layout:

- **Cores novas em todo o sistema**: troquei a paleta rosa antiga por um roxo
  com rosa (parecido com o segundo modelo que você mandou) — menu lateral,
  botões, títulos, tudo.
- **Catálogo de Produtos agora é em cards com foto**, não mais tabela: cada
  produto aparece com a foto, nome, marca, preço, lucro/margem e o estoque,
  parecido com o primeiro modelo que você mandou. Os botões de Editar,
  Estoque, Ver preços e Desativar continuam lá, dentro de cada card.
- **Fotos dos produtos**: agora dá para enviar uma foto ao cadastrar ou
  editar um produto (campo "Foto do produto"). Ela fica guardada com
  segurança no Supabase.
- **Gráficos no Painel**: acompanhando vendas, custo e lucro dos últimos 30
  dias em um gráfico, e o total a receber (saldo acumulado) em outro. Passe o
  mouse (ou o dedo, no celular) sobre o gráfico para ver os valores de cada
  dia; tem também um link "Ver como tabela" caso prefira números em vez de
  gráfico.

Ainda aguardando: os modelos de layout de telas específicas que você
mencionou (além do Catálogo, que já foi feito) e o botão de WhatsApp — esse
último fica guardado para quando construirmos a página pública de pedidos,
como você pediu.

### Passo 1 — Rodar o script de fotos no Supabase (novidade dessa vez)

1. No Supabase, vá em **SQL Editor** → **New query**.
2. Cole o conteúdo do arquivo `supabase/patch_2_fotos_produtos.sql` (está
   dentro da pasta atualizada) e clique em **Run**.
3. Isso cria o espaço de armazenamento das fotos e libera o campo de foto no
   cadastro de produtos. Sem esse passo, o envio de foto não vai funcionar.

### Passo 2 — Atualizar os arquivos no GitHub Desktop

Mesmo fluxo de sempre: extraia a pasta nova, copie o conteúdo para dentro da
pasta do repositório que o GitHub Desktop já reconhece (Repository → Show in
Finder/Explorer), substituindo os arquivos existentes, depois commit (ex:
"Parte 5 - visual roxo, fotos e gráficos") e **Push origin**. Não precisa
mexer em nada no Vercel.

### Passo 3 — Testar

1. Confira se o menu lateral e as telas estão com as cores novas (roxo/rosa).
2. Vá em **Catálogo de Produtos**, edite um produto e envie uma foto — confira
   se ela aparece no card depois de salvar.
3. Cadastre um produto novo já com foto.
4. No **Painel**, confira os dois gráficos novos (vendas/custo/lucro e contas
   a receber). Se ainda não tiver vendas recentes, os gráficos aparecem
   "zerados" — é esperado, eles só mostram o que já foi cadastrado.

Qualquer erro, me manda o print (e o que aparecer em vermelho no Console do
navegador, se for erro de tela).

---

## Atualização — Parte 4 (logo)

Coloquei a sua logo (BM Espaço Multimarcas) no menu lateral e na tela de
login, além de deixá-la como ícone da aba do navegador. Mesmo fluxo de
sempre para atualizar: copiar os arquivos novos para a pasta do repositório,
commit e push — sem mudanças no Supabase ou no Vercel.

Ainda aguardando: os modelos de layout do Catálogo e das outras telas (e as
fotos dos produtos, que entram junto com esse redesenho).

---

## Atualização — Parte 3 (ajuste para celular)

Ajustei o menu lateral: no celular, ele agora vira um botão de menu (☰) no
topo, em vez de ocupar a tela toda com a lista de páginas. As tabelas e
formulários já tinham rolagem lateral para telas pequenas, então essa era a
peça que faltava para usar o sistema confortavelmente pelo celular.

Ainda pendentes, aguardando o que você vai me mandar:
- A sua logo (para colocar no menu e na tela de login).
- Os modelos de layout do Catálogo e das outras telas (e, junto com isso,
  fotos dos produtos).
- O botão de WhatsApp fica guardado para quando construirmos a página pública
  de pedidos.

Para atualizar, é o mesmo fluxo de sempre: extraia a pasta nova, copie o
conteúdo para dentro da pasta do repositório que o GitHub Desktop já
reconhece (Repository → Show in Finder/Explorer), commit e push. Sem
mudanças no Supabase ou no Vercel dessa vez.

---

## Atualização — Parte 2

Essa entrega traz as telas que faltavam: **Nova Venda**, **Vendas** (com cancelamento),
**Contas a Receber**, **Recebimentos**, **Clientes** e o **Painel** com os resumos.
Também troquei o nome que aparece no menu lateral para "Beatriz Miguel".

Você **não precisa repetir a configuração do Supabase, do login nem do Vercel** —
é só atualizar os arquivos do projeto. Siga os passos abaixo, na ordem.

### Passo 1 — Rodar a correção de segurança (se ainda não rodou)

Se você já rodou o arquivo `patch_1_seguranca_views.sql` que te mandei antes, pule
para o Passo 2. Se ainda não rodou:

1. No Supabase, vá em **SQL Editor** → **New query**.
2. Cole o conteúdo do arquivo `supabase/patch_1_seguranca_views.sql` (está dentro
   da pasta atualizada) e clique em **Run**.

### Passo 2 — Atualizar os arquivos no GitHub Desktop

1. Extraia (descompacte) a nova pasta `revenda-cosmeticos` que te enviei, em um
   local qualquer (pode ser a Área de Trabalho, por exemplo).
2. Abra o **GitHub Desktop**. Confirme que o repositório selecionado (canto
   superior esquerdo) é o **revenda-cosmeticos**.
3. No menu **Repository** → **Show in Finder** (Mac) ou **Show in Explorer**
   (Windows), abra a pasta onde esse repositório vive no seu computador — é a
   mesma pasta de quando corrigimos o problema do 404, que já tem o
   `package.json`, `app`, `components`, `lib`, `supabase` etc.
4. Dentro da pasta que você **extraiu agora** (Passo 1), selecione tudo que
   está dentro dela — o `package.json` e todas as pastas ao lado dele — e
   copie.
5. Cole dentro da pasta do repositório (a do passo 3), substituindo/mesclando
   os arquivos que já existem (o computador vai perguntar se quer substituir —
   pode confirmar que sim).
6. Volte para o GitHub Desktop. Ele vai mostrar uma lista de arquivos novos e
   alterados do lado esquerdo. Escreva uma mensagem de commit, por exemplo
   "Parte 2 - Vendas, Recebimentos, Clientes, Painel", e clique em
   **Commit to main**.
7. Clique em **Push origin** (canto superior direito).

A Vercel vai perceber esse envio sozinha e começar um novo deploy automaticamente.
Aguarde 1-2 minutos, confira em **Deployments** se ficou **Ready**, e acesse o
link do sistema de novo.

### Passo 3 — Testar as telas novas

1. **Nova Venda**: escolha (ou cadastre) um cliente, adicione um ou mais
   produtos com quantidade, escolha a forma de pagamento, informe entrada e
   parcelas se for o caso, e registre a venda. Confira se o estoque do produto
   baixou sozinho (veja em Catálogo).
2. **Vendas**: veja se a venda aparece na lista, clique em "Ver itens" para
   conferir os produtos, e teste o botão "Cancelar venda" — o estoque deve
   voltar sozinho.
3. **Contas a Receber**: se a venda tiver saldo devedor, ela deve aparecer aqui.
4. **Recebimentos**: registre um pagamento para uma venda em aberto e confira
   se o saldo devedor dela diminuiu.
5. **Clientes**: confira se o cliente aparece com o total comprado e o
   histórico de compras.
6. **Painel**: confira se os resumos (vendas do mês, total a receber, estoque
   baixo) aparecem corretos.

Qualquer erro, me manda o print (e o que aparecer em vermelho no Console do
navegador, se for erro de tela).

---

## O que já está pronto

- Banco de dados completo (produtos, estoque, clientes, vendas, itens de
  venda, recebimentos, formas de pagamento, marcas), com os cálculos
  automáticos, controle de estoque com entrada/saída, e cancelamento de venda
  com devolução ao estoque.
- Login (só você acessa).
- Configurações: formas de pagamento (taxa editável, multiplicador automático)
  e marcas.
- Catálogo de Produtos: cards com foto, estoque, campo "pronto para entrega",
  preços por forma de pagamento.
- Nova Venda: escolha de cliente e produtos do catálogo com quantidade,
  cálculo automático de valor e baixa de estoque.
- Vendas: lista completa, detalhes por venda, cancelamento com devolução ao
  estoque.
- Contas a Receber: calculado na hora, com dias em atraso.
- Recebimentos: registro de pagamentos recebidos (entrada ou parcela).
- Clientes: cadastro com telefone e histórico de compras.
- Painel: resumo com vendas do mês, lucro do mês, total a receber, vendas
  atrasadas, gráficos de vendas/custo/lucro e contas a receber (últimos 30
  dias), últimas vendas e produtos com estoque baixo.

## O que vem depois (fase futura, combinada desde o início)

- Página pública de catálogo para seus clientes fazerem pedidos (produtos
  "prontos para entrega"), quando você quiser avançar para essa fase.

---

## Configuração inicial (Parte 1) — já feita, guardada aqui como referência

Estes passos você já fez. Ficam aqui só para o caso de precisar recriar o
projeto do zero um dia (ex: outro computador).

### Passo 1 — Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e entre na sua conta.
2. Clique em **New Project**.
3. Dê um nome, por exemplo `revenda-cosmeticos`, escolha uma senha de banco de
   dados (guarde essa senha em local seguro) e a região mais próxima (South
   America).
4. Se aparecer uma seção **Security**, deixe como vem por padrão: **Enable
   Data API** marcado, **Automatically expose new tables** marcado,
   **Enable automatic RLS** desmarcado, **Postgres Type** = "Postgres".
5. Clique em **Create new project** e aguarde ficar pronto.

### Passo 2 — Rodar o script do banco de dados

1. No **SQL Editor** → **New query**, cole o conteúdo de `supabase/schema.sql`
   e clique em **Run**.
2. Em seguida, cole e rode também `supabase/patch_1_seguranca_views.sql`
   (correção de segurança das visões).

### Passo 3 — Criar seu usuário de login

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. E-mail e senha à sua escolha, marque **Auto Confirm User** se aparecer.

### Passo 4 — Pegar as chaves do projeto

1. **Settings** → **API Keys** (ou o botão **Connect** no topo da página).
2. Copie o **Project URL** e a chave pública (**anon** ou **Publishable key**).

### Passo 5 — Enviar os arquivos pelo GitHub Desktop

1. Extraia a pasta do projeto.
2. No GitHub Desktop, **File** → **Add Local Repository**, selecione a pasta
   extraída (confirme que ela tenha `package.json` direto dentro, não uma
   subpasta).
3. Commit e **Publish repository**.

### Passo 6 — Publicar no Vercel

1. **Add New** → **Project**, selecione o repositório, **Import**.
2. Confirme que o **Framework Preset** está como **Next.js** (não "Other").
3. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores do Passo 4.
4. Em **Settings → Deployment Protection**, deixe **Disabled** (o login do
   próprio sistema já protege o acesso).
5. Clique em **Deploy**.
