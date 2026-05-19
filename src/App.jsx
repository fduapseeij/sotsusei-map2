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
import {
  savePhoto,
  getPhoto,
  deletePhoto,
} from "./db";

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
function AddMarker({
  markers,
  setMarkers,
  category,
  moveMode,
}) {
  useMapEvents({
    click(e) {
      // 移動モード中は追加しない
      if (moveMode) return;

      const newMarker = {
        id: Date.now() + Math.random(),

        lat: e.latlng.lat,
        lng: e.latlng.lng,

        category,
        memo: "",
        photos: [],
      };

      setMarkers((prev) => [
        ...prev,
        newMarker,
      ]);
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

  // --------------------
  // 移動モード
  // --------------------
  const [moveMode, setMoveMode] =
    useState(false);

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

  // カテゴリ変更
  const updateCategory = (
    index,
    newCategory
  ) => {
    const updated = [
      ...markers,
    ];

    updated[index] = {
      ...updated[index],
      category:
        newCategory,
    };

    setMarkers(updated);
  };

  // ピン移動
  const updateMarkerPosition = (
    index,
    newLatLng
  ) => {
    const updated = [
      ...markers,
    ];

    updated[index] = {
      ...updated[index],
      lat: newLatLng.lat,
      lng: newLatLng.lng,
    };

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

  // 写真更新（複数）
  const updatePhoto = async (
    index,
    files
  ) => {
    if (
      !files ||
      files.length === 0
    )
      return;

    const updated = [
      ...markers,
    ];

    const currentPhotos =
      updated[index]
        .photos || [];

    const newPhotos = [];

    for (
      let i = 0;
      i < files.length;
      i++
    ) {
      const file =
        files[i];

      const key =
        `photo-${
          markers[index].id
        }-${Date.now()}-${i}`;

      await savePhoto(
        key,
        file
      );

      newPhotos.push({
        key,
        preview:
          URL.createObjectURL(
            file
          ),
      });
    }

    updated[index] = {
      ...updated[index],
      photos: [
        ...currentPhotos,
        ...newPhotos,
      ],
    };

    setMarkers(updated);
  };

  // 写真削除
  const removePhoto =
    async (
      index,
      photoIndex
    ) => {
      const updated = [
        ...markers,
      ];

      const targetPhoto =
        updated[index]
          .photos[
          photoIndex
        ];

      await deletePhoto(
        targetPhoto.key
      );

      updated[
        index
      ].photos =
        updated[
          index
        ].photos.filter(
          (_, i) =>
            i !== photoIndex
        );

      setMarkers(updated);
    };
  
  // --------------------
  // 画像圧縮
  // --------------------
  const compressImage = (
    file,
    maxWidth = 1200,
    quality = 0.7
  ) => {
    return new Promise(
      (resolve) => {
        const img =
          new Image();

        const reader =
          new FileReader();

        reader.onload =
          (e) => {
            img.src =
              e.target.result;
          };

        img.onload = () => {
          const canvas =
            document.createElement(
              "canvas"
            );

          let width =
            img.width;

          let height =
            img.height;

          // 横幅制限
          if (
            width >
            maxWidth
          ) {
            height =
              height *
              (
                maxWidth /
                width
              );

            width =
              maxWidth;
          }

          canvas.width =
            width;

          canvas.height =
            height;

          const ctx =
            canvas.getContext(
              "2d"
            );

          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              quality
            )
          );
        };

        reader.readAsDataURL(
          file
        );
      }
    );
  };

  // --------------------
  // JSON保存
  // --------------------
  const exportJSON =
    async () => {
      const markersWithPhotos =
        await Promise.all(
          markers.map(
            async (
              marker
            ) => {
              const photos =
                [];

              for (
                const photo of marker.photos ||
                []
              ) {
                const file =
                  await getPhoto(
                    photo.key
                  );

                if (
                  file
                ) {
                  const compressed =
                    await compressImage(
                      file
                    );

                  photos.push(
                    compressed
                  );
                }
              }

              return {
                ...marker,
                exportPhotos:
                  photos,
              };
            }
          )
        );

      const jsonData =
        JSON.stringify(
          markersWithPhotos,
          null,
          2
        );

      const blob =
        new Blob(
          [jsonData],
          {
            type:
              "application/json",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          "a"
        );

      a.href = url;
      a.download =
        "field-survey.json";

      a.click();

      URL.revokeObjectURL(
        url
      );
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

        const restorePhotos =
          async (
            imported
          ) => {
            const restored =
              await Promise.all(
                imported.map(
                  async (
                    marker
                  ) => {
                    // exportPhotosがない
                    if (
                      !marker.exportPhotos
                    ) {
                      return marker;
                    }

                    const photoUrls =
                      [];

                    for (
                      let i = 0;
                      i <
                      marker
                        .exportPhotos
                        .length;
                      i++
                    ) {
                      const base64 =
                        marker
                          .exportPhotos[
                          i
                        ];

                      const response =
                        await fetch(
                          base64
                        );

                      const blob =
                        await response.blob();

                      const file =
                        new File(
                          [blob],
                          `photo-${i}.jpg`,
                          {
                            type:
                              "image/jpeg",
                          }
                        );

                      const key =
                        `photo-${marker.id}-${Date.now()}-${i}`;

                      await savePhoto(
                        key,
                        file
                      );

                      photoUrls.push({
                        key,
                        url:
                          URL.createObjectURL(
                            file
                          ),
                      });
                    }

                    return {
                      ...marker,
                      photos:
                        photoUrls,
                    };
                  }
                )
              );

            return restored;
          };

        if (shouldReplace) {
          restorePhotos(
            importedMarkers
          ).then(
            (
              restoredMarkers
            ) => {
              setMarkers(
                restoredMarkers
              );
            }
          );
        } else {
          restorePhotos(
            importedMarkers
          ).then(
            (
              restoredMarkers
            ) => {
              setMarkers(
                (prev) => [
                  ...prev,
                  ...restoredMarkers,
                ]
              );
            }
          );
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

        <button
          onClick={() =>
            setMoveMode(!moveMode)
          }
        >
          {moveMode
            ? "移動モードON"
            : "移動モードOFF"}
        </button>

        <br />

        <br />
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
          moveMode={moveMode}
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
              iconMap[
                marker.category
              ]
            }
            draggable={moveMode}
            eventHandlers={{
              dragend: (e) => {
                updateMarkerPosition(
                  index,
                  e.target.getLatLng()
                );
              },
            }}
          >
            <Popup>
              <strong>
                {marker.category}
              </strong>

              <br />
              <br />

              カテゴリ変更
              <br />

              <select
                value={marker.category}
                onChange={(e) =>
                  updateCategory(
                    index,
                    e.target.value
                  )
                }
              >
                <option>空き家</option>
                <option>気になる場所</option>
                <option>良い場所</option>
              </select>

              <br />
              <br />

              <br />

              緯度:
              {marker.lat.toFixed(5)}

              <br />

              経度:
              {marker.lng.toFixed(5)}

              <br />
              <br />

              写真
              <br />

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  updatePhoto(
                    index,
                    e.target.files
                  )
                }
              />

              <br />
              <br />

              {marker.photos?.length >
                0 && (
                <>
                  {marker.photos.map(
                    (
                      photo,
                      photoIndex
                    ) => (
                      <div
                        key={photoIndex}
                        style={{
                          marginBottom:
                            "10px",
                        }}
                      >
                        <img
                          src={
                            photo.preview ||
                            photo.url
                          }
                          alt="現地写真"
                          style={{
                            width:
                              "100%",
                            borderRadius:
                              "8px",
                          }}
                        />

                        <br />

                        <button
                          onClick={() =>
                            removePhoto(
                              index,
                              photoIndex
                            )
                          }
                        >
                          写真削除
                        </button>
                      </div>
                    )
                  )}
                </>
              )}

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