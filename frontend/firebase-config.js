// firebase-config.js

// 1. Importa as ferramentas de inicialização do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
// Adicionado o GoogleAuthProvider na importação abaixo:
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// 2. A sua "Chave Mestra"
const firebaseConfig = {
    apiKey: "AIzaSyD7eH-pHtJ0zor5rDmQavV5CZZbY6fWFuE",
    authDomain: "painel-pricing-96298.firebaseapp.com",
    databaseURL: "https://painel-pricing-96298-default-rtdb.firebaseio.com",
    projectId: "painel-pricing-96298",
    storageBucket: "painel-pricing-96298.firebasestorage.app",
    messagingSenderId: "1079180686361",
    appId: "1:1079180686361:web:9dfd373651db673a41e688"
};

// 3. Inicializa o aplicativo, o banco e a autenticação
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// INICIALIZA O PROVEDOR DO GOOGLE AQUI
const provider = new GoogleAuthProvider();

// 4. Exporta o banco (db), autenticação (auth) e o provedor (provider) para as outras páginas usarem
export { db, auth, provider };