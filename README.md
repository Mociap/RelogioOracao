# Sistema de Reserva de Salas - Secretária Virtual Ester

Sistema web para agendamento de salas com assistente virtual inteligente, integração com Google Calendar, Firebase e Supabase.

## 🚀 Funcionalidades

- **Assistente Virtual**: Ester guia o usuário através do processo de reserva
- **Integração Google Calendar**: Sincronização automática com calendários
- **Painel Administrativo**: Gerenciamento completo de agendamentos
- **Banco de Dados**: Suporte a Firebase Firestore e Supabase
- **Interface Responsiva**: Design moderno e adaptável

## 📋 Pré-requisitos

- Navegador web moderno
- Conta no Firebase
- Conta no Supabase
- API do Google Calendar configurada

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/sistema-reserva-salas.git
cd sistema-reserva-salas
```

### 2. Configure as variáveis de ambiente

1. Copie o arquivo de exemplo:
```bash
cp config.example.js config.js
```

2. Edite o arquivo `config.js` com suas configurações:

#### Firebase
- Acesse o [Console do Firebase](https://console.firebase.google.com/)
- Crie um novo projeto ou use um existente
- Vá em "Configurações do projeto" > "Geral" > "Seus aplicativos"
- Copie as configurações do Firebase para o arquivo `config.js`

#### Supabase
- Acesse o [Dashboard do Supabase](https://app.supabase.com/)
- Crie um novo projeto ou use um existente
- Vá em "Settings" > "API"
- Copie a URL e a chave anônima para o arquivo `config.js`

#### Google Calendar
- Acesse o [Google Cloud Console](https://console.cloud.google.com/)
- Ative a API do Google Calendar
- Crie credenciais (API Key e OAuth 2.0)
- Configure o OAuth consent screen
- Copie as configurações para o arquivo `config.js`

### 3. Estrutura do banco de dados

#### Firebase Firestore
Crie as seguintes coleções:
```
secretaria/
├── sala/
│   └── CadSala/
│       └── {documentos com campo 'sala'}
└── agendamentos/
    └── {documentos de agendamento}
```

#### Supabase (opcional)
Configure as tabelas conforme necessário para backup ou funcionalidades adicionais.

## 🚀 Deploy

### Deploy Local
1. Abra o arquivo `index.html` em um servidor web local
2. Ou use um servidor simples:
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

### Deploy em Produção

#### Netlify
1. Faça fork do repositório
2. Conecte sua conta Netlify ao GitHub
3. Configure as variáveis de ambiente no painel da Netlify
4. Deploy automático a cada push

#### Vercel
1. Instale a CLI do Vercel: `npm i -g vercel`
2. Execute: `vercel`
3. Configure as variáveis de ambiente

#### GitHub Pages
1. Vá em Settings > Pages no seu repositório
2. Selecione a branch main como source
3. Configure um domínio personalizado se necessário

## 🔧 Configuração Avançada

### Personalização da Secretária Virtual
Edite o arquivo `js/index.js` para personalizar:
- Mensagens da Ester
- Fluxo de conversação
- Validações personalizadas

### Configuração do Google Calendar
Consulte o arquivo `GOOGLE_CALENDAR_SETUP.md` para instruções detalhadas.

### Painel Administrativo
- Acesse `/admin.html`
- Use a senha configurada em `config.js`
- Gerencie agendamentos, salas e configurações

## 📁 Estrutura do Projeto

```
├── assets/                 # Imagens e ícones
├── css/
│   └── style.css          # Estilos principais
├── js/
│   ├── admin.js           # Lógica do painel admin
│   ├── firebase.js        # Configuração Firebase
│   ├── google-calendar.js # Integração Google Calendar
│   ├── index.js           # Lógica principal
│   └── supabase.js        # Configuração Supabase
├── admin.html             # Painel administrativo
├── index.html             # Página principal
├── login.html             # Login do admin
├── config.example.js      # Exemplo de configuração
└── README.md              # Este arquivo
```

## 🔒 Segurança

- **Nunca** commite o arquivo `config.js` com suas chaves reais
- Use variáveis de ambiente em produção
- Configure regras de segurança no Firebase
- Implemente autenticação adequada para o painel admin

## 🐛 Solução de Problemas

### Erro de CORS
- Certifique-se de que o domínio está autorizado no Google Cloud Console
- Configure os domínios permitidos no Firebase

### Problemas de Autenticação
- Verifique se as chaves de API estão corretas
- Confirme se os serviços estão ativos

### Calendário não sincroniza
- Verifique as permissões da API do Google Calendar
- Confirme se o ID do calendário está correto

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs do navegador (F12)
3. Abra uma issue no GitHub

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

**Desenvolvido com ❤️ para facilitar o agendamento de salas**