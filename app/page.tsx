"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  // 入力フォーム用の状態
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState(1);

  // 1. データのリアルタイム取得
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "items"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(data);
    });
    return () => unsub();
  }, []);

  // 2. 新しいアイテムをFirebaseに追加
  const addItem = async (e: React.FormEvent) => {
    e.preventDefault(); // ページのリロードを防ぐ
    if (newName !== "") {
      await addDoc(collection(db, "items"), {
        name: newName,
        stock: newStock,
      });
      setNewName(""); // 入力欄を空にする
      setNewStock(1);
    }
  };

  // 3. 在庫を減らす
  const decreaseStock = async (id: string, currentStock: number) => {
    if (currentStock > 0) {
      const itemRef = doc(db, "items", id);
      await updateDoc(itemRef, { stock: currentStock - 1 });
    }
  };

  // 4. アイテムを削除する
  const deleteItem = async (id: string) => {
    if (confirm("本当に削除しますか？")) {
      await deleteDoc(doc(db, "items", id));
    }
  };

  return (
    <main style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>🏠 在庫マネージャー</h1>

      {/* --- アイテム追加フォーム --- */}
      <form onSubmit={addItem} style={{ 
        display: "flex", gap: "10px", marginBottom: "30px", padding: "20px", 
        backgroundColor: "#f9f9f9", borderRadius: "12px", border: "1px solid #eee" 
      }}>
        <input 
          type="text" placeholder="商品名（例：シャンプー）" value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 2, padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
        />
        <input 
          type="number" value={newStock} min="0"
          onChange={(e) => setNewStock(Number(e.target.value))}
          style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
        />
        <button type="submit" style={{ 
          padding: "10px 20px", backgroundColor: "#28a745", color: "white", 
          border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" 
        }}>追加</button>
      </form>

      {/* --- 在庫リスト表示 --- */}
      <div style={{ display: "grid", gap: "15px" }}>
        {items.map((item) => (
          <div key={item.id} style={{ 
            padding: "20px", border: "1px solid #ddd", borderRadius: "12px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            backgroundColor: "white"
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>{item.name}</div>
              <div style={{ color: item.stock === 0 ? "red" : "#666" }}>在庫: {item.stock} 個</div>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => decreaseStock(item.id, item.stock)}
                disabled={item.stock === 0}
                style={{ 
                  padding: "8px 16px", borderRadius: "6px", border: "none",
                  backgroundColor: item.stock === 0 ? "#eee" : "#0070f3",
                  color: item.stock === 0 ? "#aaa" : "white", cursor: "pointer"
                }}
              >
                消費
              </button>
              <button 
                onClick={() => deleteItem(item.id)}
                style={{ 
                  padding: "8px 16px", borderRadius: "6px", border: "1px solid #ff4757",
                  backgroundColor: "transparent", color: "#ff4757", cursor: "pointer"
                }}
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}