# 🚀 Guia Completo de Deploy no cPanel - Shopee Brasil

Este guia vai te ensinar passo a passo como fazer o deploy do seu projeto React/Expo no cPanel.

---

## 📦 Preparação (JÁ FEITA!)

✅ Build gerado na pasta `dist/` (6.1 MB)
✅ Arquivo `.htaccess` criado para SPA routing
✅ TODAS as imagens incluídas nos formatos originais (.jpg, .webp, .png)
✅ Variáveis de ambiente incluídas no build
✅ Pacote `cpanel-deploy.tar.gz` criado (3.2 MB compactado)

---

## 🎯 Método 1: Upload via File Manager do cPanel (RECOMENDADO)

### Passo 1: Preparar o arquivo ZIP

1. **No seu computador**, navegue até a pasta do projeto
2. Entre na pasta `dist/`
3. Selecione **TODO O CONTEÚDO** da pasta `dist/` (não a pasta em si)
4. Compacte em um arquivo ZIP chamado `site.zip`

**Estrutura que deve ser compactada:**
```
site.zip contém:
├── .htaccess
├── index.html
├── favicon.ico
├── metadata.json
├── _expo/
└── assets/
```

### Passo 2: Acessar o cPanel

1. Acesse o painel do seu host ing (exemplo: `seusite.com/cpanel` ou `seusite.com:2083`)
2. Faça login com suas credenciais

### Passo 3: Fazer Upload

1. No cPanel, procure por **"Gerenciador de Arquivos"** ou **"File Manager"**
2. Clique para abrir
3. Navegue até a pasta `public_html` (ou `www` dependendo do host)
4. **IMPORTANTE**: Faça backup de tudo que está lá antes de continuar!
5. **Limpe a pasta** `public_html` (delete tudo dentro dela)
6. Clique em **"Upload"** ou **"Enviar Arquivos"**
7. Selecione o arquivo `site.zip` que você criou
8. Aguarde o upload completar (pode demorar alguns minutos)

### Passo 4: Extrair o ZIP

1. Volte para o File Manager
2. Localize o arquivo `site.zip` em `public_html`
3. Clique com botão direito no arquivo
4. Selecione **"Extract"** ou **"Extrair"**
5. Confirme que vai extrair para `public_html`
6. Aguarde a extração
7. **Delete o arquivo `site.zip`** após extrair

### Passo 5: Verificar

1. Acesse `seudominio.com` no navegador
2. O site deve carregar normalmente
3. Teste navegar entre as páginas (/, /cart, /checkout, /chat)
4. Teste adicionar produtos ao carrinho
5. Teste o chat

---

## 🌐 Método 2: Upload via FTP

### Requisitos

- Cliente FTP (FileZilla, WinSCP, Cyberduck, etc.)
- Credenciais FTP do cPanel

### Passo 1: Obter Credenciais FTP

1. No cPanel, procure por **"Contas FTP"** ou **"FTP Accounts"**
2. Você verá suas credenciais ou pode criar uma nova conta
3. Anote:
   - Host: `ftp.seudominio.com` ou IP do servidor
   - Usuário: `usuario@seudominio.com`
   - Senha: (sua senha)
   - Porta: 21 (padrão)

### Passo 2: Conectar via FTP

1. Abra seu cliente FTP
2. Crie uma nova conexão com os dados acima
3. Conecte ao servidor

### Passo 3: Fazer Upload

1. No lado esquerdo (seu computador), navegue até a pasta `dist/` do projeto
2. No lado direito (servidor), navegue até `public_html`
3. **Limpe a pasta `public_html`** no servidor
4. Selecione **TODO O CONTEÚDO** da pasta `dist/`
5. Arraste para `public_html`
6. Aguarde o upload completar

**DICA**: O upload via FTP pode demorar 10-20 minutos dependendo da velocidade da internet.

---

## ✅ Checklist Pós-Deploy

Após o deploy, verifique:

- [ ] Página inicial (`/`) carrega corretamente
- [ ] Logo da Shopee aparece
- [ ] Imagens dos produtos carregam
- [ ] Botão "Adicionar ao Carrinho" funciona
- [ ] Página `/cart` funciona
- [ ] Página `/checkout` funciona
- [ ] Chat (`/chat`) funciona
- [ ] Conexão com Supabase está funcionando
- [ ] Não há erros no console (F12 → Console)

---

## 🐛 Troubleshooting - Problemas Comuns

### Problema 1: Página em Branco

**Causa**: Arquivo `index.html` não está na raiz de `public_html`

**Solução**:
1. Verifique se `index.html` está em `public_html/index.html`
2. Se estiver em `public_html/dist/index.html`, mova tudo de `dist/` para `public_html/`

### Problema 2: Erro 404 ao Navegar

**Causa**: Arquivo `.htaccess` não foi enviado ou está incorreto

**Solução**:
1. Verifique se `.htaccess` existe em `public_html/.htaccess`
2. Arquivos que começam com `.` são ocultos. No File Manager, ative "Show Hidden Files"
3. Se não existir, crie um arquivo `.htaccess` com o conteúdo fornecido

### Problema 3: Imagens Não Carregam

**Causa**: Pasta `assets/` ou `_expo/` não foi enviada

**Solução**:
1. Verifique se existe `public_html/assets/` e `public_html/_expo/`
2. Refaça o upload se necessário

### Problema 4: Erro "ERR_CONNECTION_REFUSED"

**Causa**: Supabase não está conectando

**Solução**:
1. As variáveis de ambiente foram incluídas no build
2. Teste manualmente: abra F12 → Console e digite:
```javascript
console.log(process.env.EXPO_PUBLIC_SUPABASE_URL)
```
3. Se retornar `undefined`, o build precisa ser refeito com as variáveis corretas

### Problema 5: Site Funciona mas Chat/Carrinho Não

**Causa**: Problema com Supabase ou RLS

**Solução**:
1. Verifique se o Supabase está online: `https://app.supabase.com`
2. Verifique as políticas RLS nas tabelas
3. Teste a conexão no console:
```javascript
// No console do navegador (F12)
fetch('https://ykvvltnfhzbqykxcizij.supabase.co/rest/v1/')
  .then(r => r.json())
  .then(console.log)
```

---

## 🔒 Configurar HTTPS (SSL)

### Via Let's Encrypt (Gratuito)

1. No cPanel, procure por **"SSL/TLS Status"** ou **"Let's Encrypt"**
2. Selecione seu domínio
3. Clique em **"Run AutoSSL"**
4. Aguarde a instalação (2-5 minutos)
5. Seu site agora terá HTTPS automático!

### Forçar HTTPS

Se quiser que TODOS os acessos sejam HTTPS, descomente estas linhas no `.htaccess`:

```apache
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
```

Remova o `#` no início das linhas.

---

## 📊 Estrutura Final no Servidor

Após o deploy, sua pasta `public_html` deve ficar assim:

```
public_html/
├── .htaccess                 ← Regras de redirecionamento
├── index.html                ← Página principal
├── favicon.ico               ← Ícone do site
├── metadata.json             ← Metadados do Expo
├── _expo/
│   └── static/
│       ├── css/              ← Estilos
│       ├── js/               ← JavaScript bundles
│       │   └── web/
│       │       └── entry-xxx.js  ← Bundle principal (3.4 MB)
│       └── media/            ← Fontes e outros
└── assets/
    ├── images/               ← Suas imagens
    └── node_modules/         ← Assets de bibliotecas
```

**Tamanho Total**: ~3.5 MB

---

## 🔄 Como Atualizar o Site (Novo Deploy)

Quando fizer mudanças no código:

1. Execute `npm run build:web` localmente
2. A pasta `dist/` será atualizada
3. Repita o processo de upload (Método 1 ou 2)
4. **Limpe o cache do navegador** (Ctrl+F5) para ver as mudanças

---

## 💡 Dicas Importantes

1. **Sempre faça backup** antes de substituir arquivos
2. **Teste localmente** antes de fazer deploy (`npm run dev`)
3. **Use HTTPS** em produção para segurança
4. **Monitore o tamanho** dos arquivos - imagens grandes deixam o site lento
5. **Verifique permissões**: arquivos devem ser 644, pastas 755

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique o console do navegador (F12 → Console)
2. Verifique os logs de erro do cPanel
3. Teste em modo anônimo/privado do navegador
4. Limpe cache e cookies

---

## ✨ Pronto!

Seu site Shopee Brasil está no ar! 🎉

Acesse: `https://seudominio.com`

---

**Última atualização**: 2025-11-20
**Tamanho do build**: 3.5 MB
**Arquivos**: 53 arquivos
