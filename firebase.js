const firebaseConfig = {
  apiKey: "AIzaSyC016HYPcR5wVeHkAW1IqRr7ZiN74C_EUE",
  authDomain: "inspectsafe.firebaseapp.com",
  projectId: "inspectsafe",
  storageBucket: "inspectsafe.firebasestorage.app",
  messagingSenderId: "909037984755",
  appId: "1:909037984755:web:cfb0acff4b5965a9e01086"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const inspectionsRef = db.collection("inspections");
