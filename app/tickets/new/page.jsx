// app/tickets/new/page.jsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "../../ui/ui.module.css";
import MainHeader from "../../components/MainHeader";
import FullScreenLoader from "../../components/FullScreenLoader";

// Tạo key duy nhất cho 1 file (dùng cho React key)
const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

export default function TicketCreatePage() {
  const router = useRouter();

  const [category, setCategory] = useState(""); // 업무 구분 (text)
  const [title, setTitle] = useState("");       // 제목
  const [assignee, setAssignee] = useState(""); // 담당자 (username, optional)
  const [content, setContent] = useState("");   // 내용
  const [files, setFiles] = useState([]);       // File[]
  const [isDropping, setIsDropping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("NEW"); // 기본: 대기
  const STATUS_OPTIONS = [
    { value: "NEW",         label: "상태: 대기" },
    { value: "IN_PROGRESS", label: "상태: 처리중" },
    { value: "DONE",        label: "상태: 완료" },
    { value: "CANCELED",    label: "상태: 취소" },
  ];
  const fileInputRef = useRef(null);

  // Nếu chưa login thì về /signin
  useEffect(() => {
    const u = localStorage.getItem("username");
    if (!u) router.replace("/");
  }, [router]);

  // Gộp file + khử trùng theo key
  const addFiles = (newFiles) => {
    setFiles((prev) => {
      const map = new Map();
      [...prev, ...newFiles].forEach((f) => map.set(fileKey(f), f));
      return Array.from(map.values());
    });
  };

  const handleFileInputChange = (e) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDropping(false);
    if (e.dataTransfer?.files?.length) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDropping(true);
  };

  const handleDragLeave = () => setIsDropping(false);

  const removeFileAt = (index) => {
    setFiles((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const clearAllFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category.trim()) {
      alert("업무 구분은 필수입니다.");
      return;
    }

    if (!title.trim()) {
      alert("제목은 필수입니다.");
      return;
    }

    if (!content.trim()) {
      alert("내용은 필수입니다.");
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

      // các field text
      fd.append("category", category.trim());        // 업무 구분
      fd.append("title", title.trim());              // 제목
      fd.append("content", content);                 // 내용
      fd.append("authorUsername", authorUsername);   // 작성자 username
      fd.append("assigneeUsername", assignee.trim()); // 담당자 (text, optional)
      fd.append("status", status);                   // 상태: NEW / IN_PROGRESS / DONE / CANCELED

      // file: gửi nhiều file cùng key "files"
      files.forEach((f) => fd.append("files", f, f.name));
      // tham số thứ 3 (f.name) không bắt buộc nhưng tốt cho server lấy filename

      const res = await fetch("/api/tickets", {
        method: "POST",
        body: fd, // ❌ KHÔNG set Content-Type, browser tự set boundary
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
    <div className={styles.main_shell}>
      <FullScreenLoader show={submitting} text="등록 중입니다..." />
      <MainHeader />
    <div className={styles.ticket_shell}>
      <form className={styles.ticket_card} onSubmit={handleSubmit}>
        {/* 제목 */}
        <div className={styles.ticket_row}>
          <label className={styles.ticket_label}>
            <span className={styles.ticket_req} />
            제목
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

        {/* 업무 구분 + 담당자 cùng 1 dòng */}
        <div className={styles.ticket_row}>
          <label className={styles.ticket_label}>
            <span className={styles.ticket_req} />
            업무구분 / 담당자 
          </label>

          <div className={styles.ticket_fieldRow}>
            {/* 업무 구분 */}
            <div className={styles.ticket_fieldCol}>
              <input
                className={styles.ticket_input}
                placeholder="업무 구분을 입력해주세요"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            {/* 담당자 */}
            <div className={styles.ticket_fieldCol}>
              <input
                className={styles.ticket_input}
                placeholder="담당자 이름을 입력해주세요 (선택)"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </div>

            {/* 상태 */}
            <div className={styles.ticket_fieldCol}>
              <select
                className={styles.ticket_select}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
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
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                className={styles.visuallyHidden}
              />
              <p className={styles.dropText}>
                버튼 클릭 또는 파일을 여기로 드래그하세요(4.5MB 이하)
              </p>
              <button
                type="button"
                className={styles.btnGhostSmall}
                onClick={() => fileInputRef.current?.click()}     
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
                  {files.map((f, i) => {
                    const isImage = f.type?.startsWith("image/");

                    return (
                      <li key={fileKey(f)} className={styles.fileItem}>
                        {isImage && (
                          <div className={styles.filePreview}>
                            <img
                              src={URL.createObjectURL(f)}
                              alt={f.name}
                              onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                            />
                          </div>
                        )}

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
                    );
                  })}
                </ul>

              </div>
            )}
          </div>
        </div>

        {/* 내용 */}
        <div className={styles.ticket_row}>
          <label className={styles.ticket_label}>
            <span className={styles.ticket_req} />
            내용
          </label>
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

        {/* 버튼들 */}
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
             등록
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}