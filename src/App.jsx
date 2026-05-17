import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --------------------
// ピン画像修正（Reactで必要）
// --------------------
delete L.Icon.Default.prototype._getIconUrl;

const BASE = import.meta.env.BASE_URL;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: BASE + "icon/marker-icon-2x.png",
  iconUrl: BASE + "icon/marker-icon.png",
  shadowUrl: BASE + "icon/marker-shadow.png",
});

// --------------------
// 色付きアイコン
// --------------------
const redIcon = new L.Icon({
  iconUrl: BASE + "icon/marker-icon-red.png",
  shadowUrl: BASE + "icon/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const blueIcon = new L.Icon({
  iconUrl: BASE + "icon/marker-icon-blue.png",
  shadowUrl: BASE + "icon/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const greenIcon = new L.Icon({
  iconUrl: BASE + "icon/marker-icon-green.png",
  shadowUrl: BASE + "icon/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --------------------
// 地図クリックでピン追加
// --------------------
function AddMarker({ markers, setMarkers, category }) {
  useMapEvents({
    click(e) {
      const newMarker = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        category,
        memo: "",
      };

      setMarkers([...markers, newMarker]);
    },
  });

  return null;
}

export default function App() {
  // --------------------
  // ピン情報保存
  // --------------------
  const [markers, setMarkers] = useState(() => {
    const savedMarkers = localStorage.getItem("markers");

    return savedMarkers
      ? JSON.parse(savedMarkers)
      : [];
  });

  // --------------------
  // 自動保存
  // --------------------
  useEffect(() => {
    localStorage.setItem(
      "markers",
      JSON.stringify(markers)
    );
  }, [markers]);

  // --------------------
  // カテゴリ
  // --------------------
  const [category, setCategory] =
    useState("空き家");

  const iconMap = {
    空き家: redIcon,
    気になる場所: blueIcon,
    良い場所: greenIcon,
  };

  // --------------------
  // ピン削除
  // --------------------
  const removeMarker = (index) => {
    const updated = [...markers];
    updated.splice(index, 1);
    setMarkers(updated);
  };

  // メモ更新
  const updateMemo = (
    index,
    newMemo
  ) => {
    const updated = [...markers];

    updated[index] = {
      ...updated[index],
      memo: newMemo,
    };

    setMarkers(updated);
  };

  // --------------------
  // JSON保存
  // --------------------
  const exportJSON = () => {
    const jsonData = JSON.stringify(
      markers,
      null,
      2
    );

    const blob = new Blob([jsonData], {
      type: "application/json",
    });

    const url =
      URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "field-survey.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  // --------------------
  // JSON読み込み
  // --------------------
  const importJSON = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const importedMarkers =
          JSON.parse(e.target.result);

        const shouldReplace = window.confirm(
          "OK：現在の作業を消して読み込む\n\nキャンセル：現在の作業に追加"
        );

        if (shouldReplace) {
          // 上書き
          setMarkers(importedMarkers);
        } else {
          // 追加
          setMarkers((prev) => [
            ...prev,
            ...importedMarkers,
          ]);
        }
      } catch (error) {
        alert(
          "JSONファイルが正しくありません"
        );
      }
    };

    reader.readAsText(file);
  };

  return (
    <>
      {/* UIパネル */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "10px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <h3>カテゴリ</h3>

        {/* JSON保存 */}
        <button onClick={exportJSON}>
          JSON保存
        </button>

        <br />
        <br />

        {/* JSON読み込み */}
        <label>
          JSON読み込み
          <br />
          <input
            type="file"
            accept=".json"
            onChange={importJSON}
          />
        </label>

        <br />
        <br />

        {/* カテゴリ選択 */}
        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
        >
          <option>空き家</option>
          <option>気になる場所</option>
          <option>良い場所</option>
        </select>

        <p>現在：{category}</p>
      </div>

      {/* 地図 */}
      <MapContainer
        center={[34.6901, 135.1955]}
        zoom={13}
        style={{
          height: "100vh",
          width: "100%",
        }}
      >
        {/* OpenStreetMap */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ピン追加 */}
        <AddMarker
          markers={markers}
          setMarkers={setMarkers}
          category={category}
        />

        {/* ピン描画 */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={[
              marker.lat,
              marker.lng,
            ]}
            icon={
              iconMap[marker.category]
            }
          >
            <Popup>
              <strong>
                {marker.category}
              </strong>

              <br />

              緯度:
              {marker.lat.toFixed(5)}

              <br />

              経度:
              {marker.lng.toFixed(5)}

              <br />
              <br />

              メモ
              <br />

              <textarea
                rows="4"
                cols="25"
                value={marker.memo || ""}
                onChange={(e) =>
                  updateMemo(
                    index,
                    e.target.value
                  )
                }
              />

              <br />
              <br />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeMarker(index);
                }}
              >
                削除
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}