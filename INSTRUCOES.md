# Sistema de Revenda de Cosméticos — Parte 1

Esta é a primeira entrega: banco de dados completo, login, tela de **Configurações**
(formas de pagamento e marcas) e tela de **Catálogo de Produtos** (com estoque e
preços calculados automaticamente por forma de pagamento). As outras telas
(Painel, Vendas, Contas a Receber, Recebimentos, Clientes) aparecem como
"em construção" por enquanto — vêm nas próximas entregas.

Siga os passos na ordem. Qualquer erro, me avise com o print da tela.

---

## Passo 1 — Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e entre na sua conta (a mesma do Almoxarifado, se quiser manter tudo no mesmo lugar).
2. Clique em **New Project**.
3. Dê um nome, por exemplo `revenda-cosmeticos`, escolha uma senha de banco de dados (guarde essa senha em local seguro) e a região mais próxima (South America).
4. Aguarde alguns minutos até o projeto ficar pronto.

> Importante: crie um projeto **novo**, separado do Almoxarifado — são dois sistemas diferentes, com bancos de dados diferentes.

---

## Passo 2 — Rodar o script do banco de dados

1. Dentro do projeto no Supabase, no menu à esquerda, clique em **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo `supabase/schema.sql` (está dentro da pasta que te enviei), copie todo o conteúdo e cole no editor.
4. Clique em **Run** (ou `Ctrl+Enter`).
5. Deve aparecer "Success. No rows returned". Isso significa que todas as tabelas, cálculos automáticos e as formas de pagamento/marcas iniciais já foram criados.

---

## Passo 3 — Criar seu usuário de login

1. No menu à esquerda, clique em **Authentication** → **Users**.
2. Clique em **Add user** → **Create new user**.
3. E-mail: `mbsilva@amigosdobem.org` (ou o e-mail que preferir usar para entrar no sistema).
4. Senha: escolha uma senha seguir e guarde-a — é com ela que você vai entrar no sistema.
5. Marque a opção **Auto Confirm User** (se aparecer), para não precisar confirmar por e-mail.
6. Clique em **Create user**.

---

## Passo 4 — Pegar as chaves do projeto

1. No menu à esquerda, clique em **Settings** (ícone de engrenagem) → **API**.
2. Copie dois valores, você vai precisar deles no Passo 6:
   - **Project URL**
   - **anon public** (a chave pública)

---

## Passo 5 — Enviar os arquivos pelo GitHub Desktop

1. Extraia (descompacte) a pasta `revenda-cosmeticos` que te enviei.
2. Abra o **GitHub Desktop**.
3. Menu **File** → **Add Local Repository** → selecione a pasta `revenda-cosmeticos` que você extraiu.
   - Se aparecer um aviso dizendo que a pasta não é um repositório Git, clique em **"create a repository"**.
4. No campo de mensagem do commit (canto inferior esquerdo), escreva algo como "Primeira versão" e clique em **Commit to main**.
5. Clique em **Publish repository** (no topo). Desmarque "Keep this code private" se quiser deixar público, ou deixe marcado para manter privado (recomendado). Clique em **Publish Repository**.

---

## Passo 6 — Publicar no Vercel

1. Acesse [vercel.com](https://vercel.com) e entre com a mesma conta do GitHub (ou crie uma conta usando "Continue with GitHub").
2. Clique em **Add New** → **Project**.
3. Selecione o repositório `revenda-cosmeticos` que você acabou de publicar e clique em **Import**.
4. Antes de clicar em Deploy, abra a seção **Environment Variables** e adicione duas variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL` → cole o **Project URL** que você copiou no Passo 4
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → cole a chave **anon public** que você copiou no Passo 4
5. Clique em **Deploy**.
6. Aguarde alguns minutos. Quando terminar, clique em **Visit** (ou no link do projeto) para abrir o sistema.

---

## Passo 7 — Testar

1. Acesse o link do Vercel. Você deve cair na tela de login.
2. Entre com o e-mail e a senha que você criou no Passo 3.
3. Você deve ver o Painel com os cartões para "Catálogo de Produtos" e "Configurações".
4. Em **Configurações**, confira se as formas de pagamento e as marcas já vieram cadastradas (Pix, Dinheiro, Tap Ton, Link, Maquininha em todas as variações, Parcelado na Confiança, e as 5 marcas). Você pode editar as taxas a qualquer momento aqui.
5. Em **Catálogo de Produtos**, cadastre um produto de teste, confira se o Lucro e a Margem aparecem certos, clique em "Ver preços" para conferir a tabela de preços por forma de pagamento, e teste o botão "Estoque" para lançar uma entrada.

Se tudo isso funcionar, está tudo certo! Qualquer erro em qualquer passo, me manda o print (e se for erro de tela no sistema, também vale abrir o "F12" do navegador, aba "Console", e me mandar o que aparecer em vermelho).

---

## O que já está pronto nesta Parte 1

- Banco de dados completo (produtos, estoque, clientes, vendas, itens de venda, recebimentos, formas de pagamento, marcas), incluindo os cálculos automáticos e o controle de estoque com entrada/saída.
- Login (só você acessa).
- Tela de Configurações: formas de pagamento (com taxa editável e multiplicador calculado sozinho) e marcas.
- Tela de Catálogo de Produtos: cadastro com marca, ciclo, custo, preço-alvo, lucro e margem automáticos, estoque com histórico de entradas/saídas, campo "pronto para entrega" (para a futura página pública), e a tabela de preços por forma de pagamento calculada automaticamente.

## O que vem nas próximas entregas

- Painel com os resumos (vendas do mês, total a receber, estoque baixo).
- Nova Venda (escolher cliente e produtos do catálogo com quantidade).
- Vendas (lista, cancelamento de venda com devolução ao estoque).
- Contas a Receber (calculado na hora, com dias em atraso).
- Recebimentos (registrar pagamentos recebidos).
- Clientes (cadastro com telefone e histórico de compras).
