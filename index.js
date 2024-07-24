import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.1.3/firebase-storage.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Elementos DOM
const adminArea = document.getElementById("admin");
const clienteArea = document.getElementById("cliente");
const formCliente = document.getElementById("form-clientes");
const loginBtn = document.getElementById("login");
const documentosContainer = document.getElementById("documentos-container");

// Provedor de autenticação do Google
const provider = new GoogleAuthProvider();

// Verifica o parâmetro da URL para definir a visibilidade da área de admin
const urlParams = new URLSearchParams(window.location.search);
const myParam = urlParams.get("admin");

if (myParam !== "true") {
  clienteArea.classList.remove("hidden");
} else {
  clienteArea.classList.add("hidden");
  adminArea.classList.remove("hidden");
}

// Envio de formulário do cliente
formCliente.addEventListener("submit", (e) => {
  e.preventDefault();

  const comprovanteText = document.getElementById("comprovante").value;
  const arquivo = document.getElementById("arquivo").files[0];

  if (!comprovanteText || !arquivo) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  const storageRef = ref(storage, "documentos/" + arquivo.name);
  const uploadTask = uploadBytesResumable(storageRef, arquivo);

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      console.log(`Progresso: ${progress}%`);
    },
    (error) => {
      console.error("Erro no upload:", error);
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((url) => {
        addDoc(collection(db, "documentos"), {
          comprovante: comprovanteText,
          url: url,
        });
        console.log("Upload concluído");
      }).catch((error) => {
        console.error("Erro ao obter URL de download:", error);
      });
    }
  );

  formCliente.reset();
});

// Autenticação com Google
loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log("Usuário logado:", user);
    })
    .catch((error) => {
      console.error("Erro na autenticação:", error);
    });
});

// Monitora mudanças de autenticação
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (user.email === "mario.carvalho.devpython@gmail.com") {
      console.log("Usuário autorizado");
      loginBtn.classList.add("hidden");
      document.getElementById("listar-pedidos").classList.remove("hidden");
    } else {
      console.log("Usuário não autorizado");
    }
  } else {
    console.log("Nenhum usuário logado");
  }
});

// Atualiza a lista de documentos em tempo real
onSnapshot(collection(db, "documentos"), (snapshot) => {
  documentosContainer.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const docDiv = document.createElement("div");
    docDiv.classList.add("documento");

    const textElement = document.createElement("p");
    textElement.textContent = data.comprovante;
    docDiv.appendChild(textElement);

    const imgElement = document.createElement("img");
    imgElement.src = data.url;
    imgElement.alt = "Imagem do documento";
    docDiv.appendChild(imgElement);

    documentosContainer.appendChild(docDiv);
  });
}, (error) => {
  console.error("Erro ao pegar documentos:", error);
});
