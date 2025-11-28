"use client";

import styles from "../ui/ui.module.css";

export default function FullScreenLoader({ show, text = "처리 중..." }) {
  if (!show) return null;

  return (
    <div className={styles.fsLoader_backdrop}>
      <div className={styles.fsLoader_box}>
        <div className={styles.fsLoader_spinner} />
        <p className={styles.fsLoader_text}>{text}</p>
      </div>
    </div>
  );
}
