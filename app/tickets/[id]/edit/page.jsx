// app/tickets/[id]/edit/page.jsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "../../../ui/ui.module.css";
import MainHeader from "../../../components/MainHeader";
import FullScreenLoader from "../../../components/FullScreenLoader";
import { upload } from "@vercel/blob/client";

const STATUS_OPTIONS = [
  { value: "NEW",         label: "상태: 대기" },
  { value: "IN_PROGRESS", label: "상태: 처리중" },
  { value: "DONE",        label: "상태: 완료" },
  { value: "CANCELED",    label: "상태: 취소" },
];
const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;
export default function TicketEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("NEW");
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [isDropping, setIsDropping] = useState(false);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("username");
    if (!u) router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!id) return;
    let aborted = false;
    async function load() {
      try {
        setLoading(true);
        setErrMsg("");
        const res = await fetch(`/api/tickets/${id}`);
        const json = await res.json();
        if (!res.ok || json.ok === false) {
          throw new Error(json.message || "요청 정보를 불러오지 못했습니다.");
        }
        if (!aborted) {
          const t = json.data;
          setTitle(t.title || "");
          setCategory(t.category || "");
          setAssignee(t.assigneeName || "");
          setContent(t.content || "");
          setStatus(t.status || "NEW");
          setExistingAttachments(t.attachments || []);
        }
      } catch (e) {
        console.error(e);
        if (!aborted) {
          setErrMsg(e.message || "오류가 발생했습니다.");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    load();
    return () => {
      aborted = true;
    };
  }, [id]);
  // ===== 새로운 파일 =====
  const addFiles = (newFiles) => {
    setUploadFiles((prev) => {
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
  const removeNewFileAt = (index) => {
    setUploadFiles((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };
  const clearAllNewFiles = () => {
    setUploadFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  // ===== 기존 파일 삭제 =====
  const removeExistingAttachment = (attachmentId) => {
    setExistingAttachments((prev) =>
      prev.filter((a) => a.id !== attachmentId)
    );
    setDeletedAttachmentIds((prev) =>
      prev.includes(attachmentId) ? prev : [...prev, attachmentId]
    );
  };
 async function uploadFilesToBlob(files) {
    const uploaded = [];
    for (const file of files) {
      const safeName = (file.name || "file").replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const pathname =
        "tickets/" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2, 8) +
        "_" +
        safeName;

      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob",
      });
      uploaded.push({
        name: file.name,
        url: blob.url,
        size: file.size,
        mimetype: file.type || "application/octet-stream",
      });
    }
    return uploaded;
  }
  // ===== submit PUT =====
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
      let attachments = [];
      if (uploadFiles.length > 0) {
      attachments = await uploadFilesToBlob(uploadFiles);
    }
    const fd = new FormData();
    fd.append("category", category.trim());
    fd.append("title", title.trim());
    fd.append("content", content);
    fd.append("authorUsername", authorUsername);
    fd.append("assigneeUsername", assignee.trim());
    fd.append("status", status);
    fd.append("attachments", JSON.stringify(attachments));
    fd.append("deletedAttachmentIds", JSON.stringify(deletedAttachmentIds));
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        throw new Error(json.message || "수정에 실패했습니다.");
      }
      alert("수정되었습니다.");
      router.push(`/tickets/${id}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "에러가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className={styles.main_shell}>
        <FullScreenLoader show={true} text="불러오는 중입니다..." />
        <MainHeader />
        <main className={styles.main_container}>
          <div className={styles.main_loading}>불러오는 중…</div>
        </main>
      </div>
    );
  }
  if (errMsg && !submitting && !loading && !title) {
    return (
      <div className={styles.main_shell}>
        <MainHeader />
        <main className={styles.main_container}>
          <div className={styles.main_error}>{errMsg}</div>
        </main>
      </div>
    );
  }
  return (
    <div className={styles.main_shell}>
      <FullScreenLoader show={submitting} text="수정 중입니다..." />
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
          {/* 업무 구분 / 담당자 / 상태 */}
          <div className={styles.ticket_row}>
            <label className={styles.ticket_label}>
              <span className={styles.ticket_req} />
              업무구분 / 담당자
            </label>
            <div className={styles.ticket_fieldRow}>
              <div className={styles.ticket_fieldCol}>
                <input
                  className={styles.ticket_input}
                  placeholder="업무 구분을 입력해주세요"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className={styles.ticket_fieldCol}>
                <input
                  className={styles.ticket_input}
                  placeholder="담당자 이름을 입력해주세요 (선택)"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
              </div>
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
          {/* 첨부파일 (기존 + 새 파일) */}
          <div className={styles.ticket_row}>
            <label className={styles.ticket_label}>첨부파일</label>
            <div className={styles.ticket_field}>
              {/* 기존 파일 */}
              {existingAttachments.length > 0 && (
                <div className={styles.filesWrap}>
                  <div className={styles.filesHeader}>
                    <strong>등록된 파일</strong>
                  </div>
                  <ul className={styles.fileList}>
                    {existingAttachments.map((file) => {
                      const isImage =
                        file.mimetype?.startsWith("image/");
                      return (
                        <li
                          key={file.id}
                          className={styles.fileItem}
                        >
                          {isImage && (
                            <div className={styles.filePreview}>
                              <img src={file.url} alt={file.name} />
                            </div>
                          )}
                          <div className={styles.fileInfo}>
                            <span className={styles.fileName}>
                              {file.name}
                            </span>
                            <span className={styles.fileMeta}>
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <button
                            type="button"
                            title="삭제"
                            aria-label={`${file.name} 삭제`}
                            className={styles.fileRemove}
                            onClick={() =>
                              removeExistingAttachment(file.id)
                            }
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {/* 드롭존 + 새 파일 목록 */}
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
                  버튼 클릭 또는 파일을 여기로 드래그하세요
                </p>
                <button
                  type="button"
                  className={styles.btnGhostSmall}
                  onClick={() => fileInputRef.current?.click()}
                >
                  파일선택
                </button>
              </div>
              {uploadFiles.length > 0 && (
                <div className={styles.filesWrap}>
                  <div className={styles.filesHeader}>
                    <strong>추가할 파일</strong>
                    <button
                      type="button"
                      className={styles.btnLinkDanger}
                      onClick={clearAllNewFiles}
                    >
                      모두 삭제
                    </button>
                  </div>
                  <ul className={styles.fileList}>
                    {uploadFiles.map((f, i) => {
                      const isImage = f.type?.startsWith("image/");
                      return (
                        <li
                          key={fileKey(f)}
                          className={styles.fileItem}
                        >
                          {isImage && (
                            <div className={styles.filePreview}>
                              <img
                                src={URL.createObjectURL(f)}
                                alt={f.name}
                                onLoad={(e) =>
                                  URL.revokeObjectURL(
                                    e.currentTarget.src
                                  )
                                }
                              />
                            </div>
                          )}
                          <div className={styles.fileInfo}>
                            <span className={styles.fileName}>
                              {f.name}
                            </span>
                            <span className={styles.fileMeta}>
                              {(f.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <button
                            type="button"
                            title="삭제"
                            aria-label={`${f.name} 삭제`}
                            className={styles.fileRemove}
                            onClick={() => removeNewFileAt(i)}
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
              수정
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
