// firebase.js
// Importar Firebase via CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Importar configurações
let firebaseConfig;
try {
  // Tentar importar configurações personalizadas
  const configModule = await import('../config.js');
  firebaseConfig = configModule.firebaseConfig;
} catch (error) {
  // Fallback para configurações padrão (desenvolvimento)
  console.warn('Arquivo config.js não encontrado, usando configurações padrão');
  firebaseConfig = {
    apiKey: "AIzaSyCEqseDS-_OSmdfGf-NNflAJnS_AT5i1-U",
    authDomain: "dbiebi.firebaseapp.com",
    databaseURL: "https://dbiebi-default-rtdb.firebaseio.com",
    projectId: "dbiebi",
    storageBucket: "dbiebi.firebasestorage.app",
    messagingSenderId: "1068164821081",
    appId: "1:1068164821081:web:2d3e0030d5311d94f30148"
  };
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
export default app;