"use client";
import { useState, useEffect } from "react";
import { db, auth, googleProvider } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  // 入力フォーム用の状態
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState<number | "">(1);
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newCategory, setNewCategory] = useState("キッチン");
  const [activeTab, setActiveTab] = useState("キッチン");

  const categories = ["キッチン", "掃除", "化粧品", "ベビー", "食品"];

  // 許可するメールアドレス一覧
  const allowedEmails = [
    "hyontarou1@gmail.com",
    "momo16lion@gmail.com",
  ];
  const isAllowed = user?.email ? allowedEmails.includes(user.email) : false;

  // 0. 認証状態を監視 + リダイレクト結果を受け取る
  useEffect(() => {
    getRedirectResult(auth).catch((err) => console.error(err));
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ログイン（スマホはリダイレクト、PCはポップアップ）
  const login = async () => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err) {
      console.error(err);
      alert("ログインに失敗しました");
    }
  };

  // ログアウト
  const logout = async () => {
    await signOut(auth);
  };

  // 1. データのリアルタイム取得（許可されたユーザーのみ）
  useEffect(() => {
    if (!user || !isAllowed) {
      setItems([]);
      return;
    }
    const unsub = onSnapshot(collection(db, "items"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(data);
    });
    return () => unsub();
  }, [user, isAllowed]);

  // 2. 新しいアイテムをFirebaseに追加
  const addItem = async (e: React.FormEvent) => {
    e.preventDefault(); // ページのリロードを防ぐ
    if (newName !== "") {
      await addDoc(collection(db, "items"), {
        name: newName,
        stock: newStock === "" ? 1 : newStock,
        price: newPrice === "" ? null : newPrice,
        category: newCategory,
      });
      setNewName(""); // 入力欄を空にする
      setNewStock(1);
      setNewPrice("");
      setNewCategory(activeTab);
    }
  };

  // 3. 在庫を増減する
  const changeStock = async (id: string, currentStock: number, delta: number) => {
    const newVal = currentStock + delta;
    if (newVal >= 0) {
      const itemRef = doc(db, "items", id);
      await updateDoc(itemRef, { stock: newVal });
    }
  };

  // 4. アイテムを削除する
  const deleteItem = async (id: string) => {
    if (confirm("本当に削除しますか？")) {
      await deleteDoc(doc(db, "items", id));
    }
  };

  // 5. アイテムを更新する
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStock, setEditStock] = useState<number | "">(0);
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editCategory, setEditCategory] = useState("キッチン");

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditStock(item.stock);
    setEditPrice(item.price ?? "");
    setEditCategory(item.category ?? "キッチン");
  };

  const saveEdit = async (id: string) => {
    const itemRef = doc(db, "items", id);
    await updateDoc(itemRef, {
      name: editName,
      stock: editStock === "" ? 0 : editStock,
      price: editPrice === "" ? null : editPrice,
      category: editCategory,
    });
    setEditingId(null);
  };

  // --- 認証チェック中 ---
  if (authLoading) {
    return (
      <main style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <p>読み込み中...</p>
      </main>
    );
  }

  // --- 未ログイン時の画面 ---
  if (!user) {
    return (
      <main style={{ padding: "40px", maxWidth: "400px", margin: "0 auto", fontFamily: "sans-serif", textAlign: "center" }}>
        <h1 style={{ marginBottom: "30px" }}>🏠 在庫マネージャー</h1>
        <p style={{ color: "#555", marginBottom: "20px" }}>ご利用にはログインが必要です</p>
        <button
          onClick={login}
          style={{
            padding: "12px 24px", backgroundColor: "#0070f3", color: "white",
            border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px"
          }}
        >
          Googleでログイン
        </button>
      </main>
    );
  }

  // --- ログイン済みだが未許可のユーザー ---
  if (!isAllowed) {
    return (
      <main style={{ padding: "40px", maxWidth: "400px", margin: "0 auto", fontFamily: "sans-serif", textAlign: "center" }}>
        <h1 style={{ marginBottom: "20px" }}>🚫 アクセス権限がありません</h1>
        <p style={{ color: "#555", marginBottom: "10px" }}>
          このアカウント（{user.email}）は利用を許可されていません。
        </p>
        <p style={{ color: "#555", marginBottom: "20px" }}>
          管理者にお問い合わせください。
        </p>
        <button
          onClick={logout}
          style={{
            padding: "10px 20px", borderRadius: "6px", border: "1px solid #ddd",
            backgroundColor: "transparent", color: "#555", cursor: "pointer"
          }}
        >
          ログアウト
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <span style={{ color: "#555", fontSize: "14px" }}>{user.email}</span>
        <button
          onClick={logout}
          style={{
            padding: "6px 14px", borderRadius: "6px", border: "1px solid #ddd",
            backgroundColor: "transparent", color: "#555", cursor: "pointer"
          }}
        >
          ログアウト
        </button>
      </div>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>🏠 在庫マネージャー</h1>

      {/* --- アイテム追加フォーム --- */}
      <form onSubmit={addItem} style={{ 
        display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "30px", padding: "20px",
        backgroundColor: "#f9f9f9", borderRadius: "12px", border: "1px solid #eee"
      }}>
        <input 
          type="text" placeholder="商品名（例：シャンプー）" value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: "2 1 150px", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", color: "#555" }}
        />
        <input
          type="number" placeholder="在庫数" value={newStock} min="0"
          onChange={(e) => setNewStock(e.target.value === "" ? "" : Number(e.target.value))}
          style={{ flex: "1 1 80px", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", color: "#555" }}
        />
        <input
          type="number" placeholder="金額（円）" value={newPrice} min="0"
          onChange={(e) => setNewPrice(e.target.value === "" ? "" : Number(e.target.value))}
          style={{ flex: "1 1 100px", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", color: "#555" }}
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          style={{ flex: "1 1 100px", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", color: "#555" }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button type="submit" style={{
          padding: "10px 20px", backgroundColor: "#28a745", color: "white",
          border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold",
          whiteSpace: "nowrap", flexShrink: 0
        }}>追加</button>
      </form>

      {/* --- カテゴリタブ --- */}
      <div style={{ display: "flex", gap: "0", marginBottom: "20px", borderBottom: "2px solid #ddd" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveTab(cat); setNewCategory(cat); }}
            style={{
              flex: 1, padding: "10px", border: "none", cursor: "pointer",
              fontWeight: activeTab === cat ? "bold" : "normal",
              color: activeTab === cat ? "#0070f3" : "#555",
              backgroundColor: "transparent",
              borderBottom: activeTab === cat ? "3px solid #0070f3" : "3px solid transparent",
              transition: "all 0.2s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* --- 在庫リスト表示 --- */}
      <div style={{ display: "grid", gap: "15px" }}>
        {items.filter((item) => item.category === activeTab).map((item) => (
          <div key={item.id} style={{
            padding: "20px", border: "1px solid #ddd", borderRadius: "12px",
            backgroundColor: "white"
          }}>
            {editingId === item.id ? (
              /* --- 編集モード --- */
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  type="text" value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd", color: "#555" }}
                />
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <input
                    type="number" value={editStock} min="0" placeholder="在庫数"
                    onChange={(e) => setEditStock(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ flex: "1 1 80px", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", color: "#555" }}
                  />
                  <input
                    type="number" value={editPrice} min="0" placeholder="金額（円）"
                    onChange={(e) => setEditPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ flex: "1 1 100px", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", color: "#555" }}
                  />
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ flex: "1 1 100px", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", color: "#555" }}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => saveEdit(item.id)}
                    style={{
                      padding: "8px 16px", borderRadius: "6px", border: "none",
                      backgroundColor: "#0070f3", color: "white", cursor: "pointer", fontWeight: "bold"
                    }}
                  >保存</button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{
                      padding: "8px 16px", borderRadius: "6px", border: "1px solid #ff4757",
                      backgroundColor: "transparent", color: "#ff4757", cursor: "pointer"
                    }}
                  >削除</button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      padding: "8px 16px", borderRadius: "6px", border: "1px solid #aaa",
                      backgroundColor: "transparent", color: "#555", cursor: "pointer"
                    }}
                  >キャンセル</button>
                </div>
              </div>
            ) : (
              /* --- 通常表示 --- */
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#000" }}>{item.name}</div>
                  <div style={{ color: item.stock === 0 ? "red" : "#666" }}>在庫: {item.stock} 個</div>
                  {item.price != null && (
                    <div style={{ color: "#666" }}>金額: ¥{item.price.toLocaleString()}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => changeStock(item.id, item.stock, -1)}
                    disabled={item.stock === 0}
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%", border: "none",
                      backgroundColor: item.stock === 0 ? "#eee" : "#ff4757",
                      color: item.stock === 0 ? "#aaa" : "white", cursor: "pointer",
                      fontSize: "18px", fontWeight: "bold", lineHeight: "1"
                    }}
                  >−</button>
                  <span style={{ minWidth: "28px", textAlign: "center", fontWeight: "bold", fontSize: "16px" }}>
                    {item.stock}
                  </span>
                  <button
                    onClick={() => changeStock(item.id, item.stock, 1)}
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%", border: "none",
                      backgroundColor: "#0070f3", color: "white", cursor: "pointer",
                      fontSize: "18px", fontWeight: "bold", lineHeight: "1"
                    }}
                  >+</button>
                  <button
                    onClick={() => startEdit(item)}
                    style={{
                      padding: "6px 14px", borderRadius: "6px", border: "1px solid #ddd",
                      backgroundColor: "transparent", color: "#555", cursor: "pointer", marginLeft: "8px"
                    }}
                  >編集</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}