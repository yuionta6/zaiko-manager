"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; // 先ほど作った設定ファイルを読み込み
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function Home() {
  const [items, setItems] = useState<any[]>([]);

  // 1. データベースからデータをリアルタイムに取得する
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

  // 2. 在庫を減らす（データベースを更新する）
  const decreaseStock = async (id: string, currentStock: number) => {
    if (currentStock > 0) {
      const itemRef = doc(db, "items", id);
      await updateDoc(itemRef, {
        stock: currentStock - 1
      });
    }
  };

  return (
    <main style={{ padding: "40px", maxWidth: "500px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>🏠 リアルタイム在庫リスト</h1>
      
      <div style={{ display: "grid", gap: "15px" }}>
        {items.map((item) => (
          <div key={item.id} style={{ 
            padding: "20px", border: "1px solid #ddd", borderRadius: "12px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
          }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>{item.name}</div>
              <div style={{ color: item.stock === 0 ? "red" : "#666" }}>残り: {item.stock} 個</div>
            </div>
            <button 
              onClick={() => decreaseStock(item.id, item.stock)}
              disabled={item.stock === 0}
              style={{ 
                padding: "10px 20px", borderRadius: "8px", border: "none",
                backgroundColor: item.stock === 0 ? "#eee" : "#0070f3",
                color: item.stock === 0 ? "#aaa" : "white", cursor: "pointer"
              }}
            >
              使った！
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}