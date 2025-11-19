"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "../../ui/ui.module.css";

// Các loại 업무 구분
const typeOptions = [
  { value: "SERVER", label: "서버" },
  { value: "CAMERA", label: "카메라" },
  { value: "LIGHT", label: "조명" },
  { value: "NETWORK", label: "네트워크" },
  { value: "OTHER", label: "기타" },
];

// Tạo key duy nhất cho 1 file
const fileKey = (f) => `${f.name}@${f.size}@${f.lastModified}`;

export default function TicketCreatePage() {
  const router = useRouter();

  const [type, setType] = useState("OTHER");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [isDropping, setIsDropping] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef(null);

  // Nếu chưa login thì đá về /signin
  useEffect(() => {
    const u = localStorage.getItem("username");
    if (!u) router.replace("/home");
  }, [router]);

  // Thêm file + khử trùng
  const addFiles = (newFiles) => {
    setFiles((prev) => {
      const map = new Map();
      [...prev, ...newFiles].forEach((f) => map.set(fileKey(f), f));
      return Array.from(map.values());
    });
  };

  const onPickFiles = (e) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDropping(false);
    if (e.dataTransfer?.files?.length) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDropping(true);
  };

  const onDragLeave = () => setIsDropping(false);

  const removeFileAt = (idx) => {
    setFiles((prev) => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  };

  const clearAllFiles = () => {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("제목은 필수입니다.");
      return;
    }

    const authorUsername = localStorage.getItem("username");
    if (!authorUsername) {
      alert("로그인 후 이용해주세요.");
      router.push("/");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("type", type);
      fd.append("title", title.trim());
      fd.append("content", content);
      fd.append("authorUsername", authorUsername);
      files.forEach((f) => fd.append("files", f)); // hiện tại API chưa lưu file, nhưng vẫn gửi được

      const res = await fetch("/api/tickets", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "등록 실패");
      }

      alert("등록되었습니다.");
      router.push("/home");
    } catch (err) {
      console.error(err);
      alert(err.message || "에러가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.ticket_shell}>
      <h1 className={styles.ticket_title}>비전정보통신</h1>

      <form className={styles.ticket_card} onSubmit={onSubmit}>
        {/* 업무 구분 */}
        <div className={styles.ticket_row}>
          <label className={styles.ticket_label}>
            업무 구분 <span className={styles.ticket_req}>*</span>
          </label>
          <div className={styles.ticket_field}>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={styles.ticket_select}
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 제목 */}
        <div className={styles.ticket_row}>
          <label className={styles.ticket_label}>
            제목 <span className={styles.ticket_req}>*</span>
          </label>
          <div className={styles.ticket_field}>
            <input
              className={styles.ticket_input}
              placeholder="제목을 입력해주세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        {/* 첨부파일 */}
        <div className={styles.ticket_row}>
          <label className={styles.ticket_label}>첨부파일</label>
          <div className={styles.ticket_field}>
            <div
              className={`${styles.dropzone} ${
                isDropping ? styles.dropzoneActive : ""
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                onChange={onPickFiles}
                className={styles.visuallyHidden}
              />
              <p className={styles.dropText}>
                버튼 클릭 또는 파일을 여기로 드래그하세요
              </p>
              <button
                type="button"
                className={styles.btnGhostSmall}
                onClick={() => inputRef.current && inputRef.current.click()}
              >
                파일선택
              </button>
            </div>

            {files.length > 0 && (
              <div className={styles.filesWrap}>
                <div className={styles.filesHeader}>
                  <strong>선택된 파일</strong>
                  <button
                    type="button"
                    className={styles.btnLinkDanger}
                    onClick={clearAllFiles}
                  >
                    모두 삭제
                  </button>
                </div>
                <ul className={styles.fileList}>
                  {files.map((f, i) => (
                    <li key={fileKey(f)} className={styles.fileItem}>
                      <div className={styles.fileInfo}>
                        <span className={styles.fileName}>{f.name}</span>
                        <span className={styles.fileMeta}>
                          {(f.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        title="삭제"
                        aria-label={`${f.name} 삭제`}
                        className={styles.fileRemove}
                        onClick={() => removeFileAt(i)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 내용 */}
        <div className={styles.ticket_row}>
          <label className={styles.ticket_label}>내용</label>
          <div className={styles.ticket_field}>
            <textarea
              className={styles.ticketTextarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={10}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className={styles.ticket_actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => router.back()}
          >
            취소
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={submitting}
          >
            {submitting ? "등록중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
