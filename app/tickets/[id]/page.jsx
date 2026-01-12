"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import MainHeader from "../../components/MainHeader";
import styles from "../../ui/ui.module.css";
import FullScreenLoader from "../../components/FullScreenLoader";

const STATUS_LABEL = {
  NEW: "대기",
  IN_PROGRESS: "처리중",
  CANCELED: "취소",
  DONE: "완료",
};

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // ✅ thêm state cho 댓글
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

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

        if (!aborted) setTicket(json.data);

        if (!aborted) {
        setTicket(json.data);
        setComments(json.data.comments || []); // ✅ nhận list comment
      }
      } catch (e) {
        console.error(e);
        if (!aborted) setErrMsg(e.message || "오류가 발생했습니다.");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.main_shell}>
        <FullScreenLoader show={loading} text="로딩중입니다..." />
        <MainHeader />
        <main className={styles.main_container}>
          <div className={styles.main_loading}>불러오는 중…</div>
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={styles.main_shell}>
        <MainHeader />
        <main className={styles.main_container}>
          <div className={styles.main_error}>
            {errMsg || "요청을 찾을 수 없습니다."}
          </div>
        </main>
      </div>
    );
  }

  const statusLabel =
    STATUS_LABEL[ticket.status || "NEW"] || ticket.status || "대기";

  const createdText = ticket.createdAt
    ? new Date(ticket.createdAt).toLocaleString("ko-KR")
    : "";

  // ---------- attachments ----------
  const attachments = ticket.attachments || [];

  const imageAttachments = attachments.filter((a) => {
    if (a.mimetype && a.mimetype.startsWith("image/")) return true;
    // fallback theo tên file
    return /\.(png|jpe?g|gif|webp)$/i.test(a.name || "");
  });

  const otherAttachments = attachments.filter(
    (a) => !imageAttachments.includes(a)
  );
  // ---------------------------------

  async function handleSubmitComment() {
    const text = commentText.trim();
    if (!text) {
      alert("댓글 내용을 입력하세요.");
      return;
    }
    if (!id) return;

    const username = localStorage.getItem("username"); // giống lúc tạo ticket
    if (!username) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      setPostingComment(true);
      const res = await fetch(`/api/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, username }),
      });

      const json = await res.json();
      if (!res.ok || json.ok === false) {
        alert(json.message || "댓글 등록에 실패했습니다.");
        return;
      }

      // ✅ thêm comment mới vào cuối list
      setComments((prev) => [...prev, json.data]);
      setCommentText("");
    } catch (err) {
      console.error(err);
      alert("댓글 등록 중 오류가 발생했습니다.");
    } finally {
      setPostingComment(false);
    }
  }

  return (
    <div className={styles.main_shell}>
      <MainHeader />
       <FullScreenLoader show={postingComment} text="댓글 등록중입니다..." />
      <main className={styles.main_container}>
        <div className={styles.ticketDetail_topBar}>
          <div className={styles.ticketDetail_titleWrap}>
            <span className={styles.ticketDetail_badge}>{ticket.category}</span>
            <h1 className={styles.ticketDetail_title}>{ticket.title}</h1>
          </div>

          <div className={styles.ticketDetail_actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => router.push("/home")}
            >
              목록
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => router.push(`/tickets/${id}/edit`)}
            >
              수정
            </button>
          </div>
        </div>

        {/* 카드 nội dung chính */}
        <section className={styles.ticketDetail_card}>
          {/* meta dòng trên */}
          <div className={styles.ticketDetail_metaRow}>
            <div>
              <span className={styles.ticketDetail_metaLabel}>작성자</span>
              <span className={styles.ticketDetail_metaValue}>
                {ticket.author?.name || ticket.author?.username || "-"}
              </span>
            </div>
            <div>
              <span className={styles.ticketDetail_metaLabel}>작성일</span>
              <span className={styles.ticketDetail_metaValue}>
                {createdText}
              </span>
            </div>
            <div>
              <span className={styles.ticketDetail_metaLabel}>상태</span>
              <span
                className={`${styles.ticketDetail_status} ${
                  ticket.status === "NEW"
                    ? styles.st_대기
                    : ticket.status === "IN_PROGRESS"
                    ? styles.st_진행
                    : ticket.status === "DONE"
                    ? styles.st_완료
                    : ticket.status === "CANCELED"
                    ? styles.st_취소
                    : ""
                }`}
              >
                {statusLabel}
              </span>
            </div>
            <div>
              <span className={styles.ticketDetail_metaLabel}>조회수</span>
              <span className={styles.ticketDetail_metaValue}>
                {ticket.views ?? 0}
              </span>
            </div>
          </div>

          {/* nội dung */}
          <div className={styles.ticketDetail_body}>
            {ticket.content?.split("\n").map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>

          {/* 첨부파일 */}
          <div className={styles.ticketDetail_filesRow}>
            <div className={styles.ticketDetail_filesLabel}>첨부파일</div>

            <div className={styles.ticket_field}>
              {attachments.length === 0 ? (
                <span className={styles.ticketDetail_noFiles}>
                  첨부파일이 없습니다.
                </span>
              ) : (
                <div className={styles.filesWrap}>
                  {/* nếu muốn có tiêu đề giống “선택된 파일” */}
                  {/* <div className={styles.filesHeader}>
                    <strong>첨부파일</strong>
                  </div> */}

                  <ul className={styles.fileList}>
                    {attachments.map((file) => {
                      const isImage =
                        file.mimetype?.startsWith("image/") ||
                        file.mimeType?.startsWith("image/");

                      return (
                        <li key={file.id} className={styles.fileItem}>
                          {/* preview 이미지 – dùng đúng layout phần đăng ký */}
                          {isImage && (
                            <div className={styles.filePreview}>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                title={file.name}
                              >
                                <img src={file.url} alt={file.name} />
                              </a>
                            </div>
                          )}

                          <div className={styles.fileInfo}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileMeta}>
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>

                          {/* file không phải ảnh thì chỉ có nút 다운로드 */}
                          {!isImage && (
                            <a
                              href={file.url}
                              className={styles.btnGhostSmall}
                              download={file.name}
                            >
                              다운로드
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 담당자 정보 */}
        <section className={styles.ticketDetail_assigneeCard}>
          <div className={styles.ticketDetail_assigneeLabel}>담당자</div>
          <div className={styles.ticketDetail_assigneeBody}>
            {ticket.assigneeName ? (
              <>
                <span className={styles.ticketDetail_assigneeName}>
                  {ticket.assigneeName}
                </span>
                {/* {ticket.assignee.phone && (
                  <span className={styles.ticketDetail_assigneePhone}>
                    ( ☎ {ticket.assignee.phone} )
                  </span>
                )} */}
              </>
            ) : (
              <span className={styles.ticketDetail_noAssignee}>
                담당자가 지정되지 않았습니다.
              </span>
            )}
          </div>
        </section>

        {/* 댓글 UI (khung) */}
        <section className={styles.ticketDetail_commentCard}>
          <div className={styles.ticketDetail_commentHeader}>
            <span>댓글</span>
            <span className={styles.ticketDetail_commentCount}>{comments.length}</span>
          </div>
          <textarea
            className={styles.ticketTextarea}
            value={commentText}
            placeholder="댓글을 입력하세요."
            maxLength={1000}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <div className={styles.ticketDetail_commentFooter}>
            <label className={styles.ticketDetail_mailCheck}>
            
            </label>
            <div className={styles.ticketDetail_commentRight}>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={postingComment}
                onClick={handleSubmitComment}
              >
                댓글 등록
              </button>
            </div>
          </div>
          {/* 리스트 comment */}
          {comments.length > 0 && (
            <ul className={styles.ticketDetail_commentList}>
              {comments.map((c) => (
                <li key={c.id} className={styles.ticketDetail_commentItem}>
                  <div className={styles.ticketDetail_commentMeta}>
                    <span className={styles.ticketDetail_commentAuthor}>
                      {c.author?.name || c.author?.username || "알 수 없음"}
                    </span>
                    <span className={styles.ticketDetail_commentDate}>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString("ko-KR")
                        : ""}
                    </span>
                  </div>
                  <div className={styles.ticketDetail_commentBody}>
                    {c.content.split("\n").map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
