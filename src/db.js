import { openDB } from "idb";

const DB_NAME =
  "fieldSurveyDB";

const STORE_NAME =
  "photos";

// DB初期化
export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (
        !db.objectStoreNames.contains(
          STORE_NAME
        )
      ) {
        db.createObjectStore(
          STORE_NAME
        );
      }
    },
  });
}

// 写真保存
export async function savePhoto(
  key,
  file
) {
  const db =
    await initDB();

  await db.put(
    STORE_NAME,
    file,
    key
  );
}

// 写真取得
export async function getPhoto(
  key
) {
  const db =
    await initDB();

  return await db.get(
    STORE_NAME,
    key
  );
}

// 写真削除
export async function deletePhoto(
  key
) {
  const db =
    await initDB();

  await db.delete(
    STORE_NAME,
    key
  );
}