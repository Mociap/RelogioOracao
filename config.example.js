// config.example.js
// Copie este arquivo para config.js e preencha com suas configurações reais

// Configuração do Firebase
export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Configuração do Supabase
export const supabaseConfig = {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_KEY'
};

// Configuração do Google Calendar
export const googleCalendarConfig = {
  apiKey: 'YOUR_GOOGLE_CALENDAR_API_KEY',
  clientId: 'YOUR_GOOGLE_CLIENT_ID',
  calendarId: 'YOUR_CALENDAR_ID'
};

// Configurações da aplicação
export const appConfig = {
  name: 'Sistema de Reserva de Salas',
  version: '1.0.0',
  environment: 'development',
  adminPassword: 'YOUR_ADMIN_PASSWORD'
};

// Configurações de desenvolvimento
export const devConfig = {
  enableDebug: true,
  logLevel: 'info'
};