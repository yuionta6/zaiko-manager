import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// あなたのFirebase鍵情報（スクリーンショットのもの）
const firebaseConfig = {
  apiKey: "AIzaSyDyJNCZ6h0yfd0NfbYzkv7vyTc7HtTu5pU",
  authDomain: "zaiko-manager-c6c48.firebaseapp.com",
  projectId: "zaiko-manager-c6c48",
  storageBucket: "zaiko-manager-c6c48.firebasestorage.app",
  messagingSenderId: "215532467012",
  appId: "1:215532467012:web:af70c0ef12dc4784a4dd11",
  measurementId: "G-84WYDDH2EW"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// 【ここが重要！】dbを「export」することで、他のファイルから使えるようになります
export const db = getFirestore(app);