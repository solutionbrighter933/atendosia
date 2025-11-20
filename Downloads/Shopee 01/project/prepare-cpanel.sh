#!/bin/bash

# Script de Preparação para Deploy no cPanel
# Shopee Brasil - Expo Web App

echo "================================================"
echo "🚀 Preparando Deploy para cPanel"
echo "================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Passo 1: Limpando builds antigos...${NC}"
rm -rf dist/
echo -e "${GREEN}✅ Limpeza concluída${NC}"
echo ""

echo -e "${BLUE}🔨 Passo 2: Gerando build de produção...${NC}"
npm run build:web

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao gerar build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build gerado com sucesso${NC}"
echo ""

echo -e "${BLUE}📄 Passo 3: Verificando .htaccess...${NC}"
if [ -f "dist/.htaccess" ]; then
    echo -e "${GREEN}✅ Arquivo .htaccess encontrado${NC}"
else
    echo -e "${YELLOW}⚠️  Criando .htaccess...${NC}"
    cat > dist/.htaccess << 'EOF'
# Expo Router SPA Configuration
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/_expo/
    RewriteCond %{REQUEST_URI} !^/assets/
    RewriteRule ^(.*)$ /index.html [L]
</IfModule>

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>
EOF
    echo -e "${GREEN}✅ .htaccess criado${NC}"
fi
echo ""

echo -e "${BLUE}📦 Passo 4: Criando arquivo ZIP para upload...${NC}"
cd dist
zip -r ../cpanel-deploy.zip . > /dev/null 2>&1

if [ $? -eq 0 ]; then
    cd ..
    FILE_SIZE=$(du -h cpanel-deploy.zip | cut -f1)
    echo -e "${GREEN}✅ Arquivo cpanel-deploy.zip criado (${FILE_SIZE})${NC}"
else
    cd ..
    echo -e "${RED}❌ Erro ao criar ZIP${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}📊 Passo 5: Informações do Build${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DIST_SIZE=$(du -sh dist | cut -f1)
FILE_COUNT=$(find dist -type f | wc -l)
echo -e "  📁 Tamanho total: ${DIST_SIZE}"
echo -e "  📄 Número de arquivos: ${FILE_COUNT}"
echo -e "  📦 Arquivo ZIP: cpanel-deploy.zip (${FILE_SIZE})"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${GREEN}✅ Preparação concluída com sucesso!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1️⃣  Faça upload do arquivo 'cpanel-deploy.zip' para o cPanel"
echo ""
echo "2️⃣  No File Manager do cPanel:"
echo "    • Navegue até public_html/"
echo "    • Faça backup do conteúdo atual"
echo "    • Limpe a pasta public_html/"
echo "    • Faça upload do cpanel-deploy.zip"
echo "    • Clique com botão direito → Extract"
echo "    • Delete o arquivo ZIP após extrair"
echo ""
echo "3️⃣  Acesse seu site e teste!"
echo ""
echo "📖 Leia o arquivo DEPLOY-CPANEL.md para instruções detalhadas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
