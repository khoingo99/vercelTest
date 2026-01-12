// app/home/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MainHeader from "../components/MainHeader";
import FullScreenLoader from "../components/FullScreenLoader";
import styles from "../ui/ui.module.css";

const STATUS_LABEL = {
  NEW: "대기 업무",
  IN_PROGRESS: "처리 중인 업무",
  CANCELED: "취소",
  DONE: "완료",
};

const STATUS_KO = {
  NEW: "대기",
  IN_PROGRESS: "처리중",
  CANCELED: "취소",
  DONE: "완료",
};

function buildPages(current, totalPages, max) {
  totalPages = Math.max(1, totalPages);
  const half = Math.floor(max / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, start + max - 1);
  start = Math.max(1, end - max + 1);
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

export default function HomePage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const size = 10;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    NEW: 0,
    IN_PROGRESS: 0,
    CANCELED: 0,
    DONE: 0,
  });

  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL | NEW | IN_PROGRESS | ...
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // check login
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) router.replace("/");
  }, [router]);

  useEffect(() => {
    let aborted = false;

    async function load() {
      try {
        setLoading(true);
        setErrMsg("");

        const res = await fetch(
          `/api/tickets?page=${page}&size=${size}&status=${filterStatus}`,
          { cache: "no-store" }
        );
        const json = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(json.message || "API error");
        }

        const items = Array.isArray(json.items) ? json.items : [];

        const mapped = items.map((t) => {
          const rawStatus = t.status || "NEW";
          return {
            id: t.id,
            type: t.category || "-",
            status: STATUS_KO[rawStatus] || "대기",
            rawStatus,
            title: t.title || "-",
            author:
              (t.author && (t.author.name || t.author.username)) || "-",
            assignee: t.assigneeName || "-",
            date: t.createdAt
              ? new Date(t.createdAt).toLocaleDateString("ko-KR")
              : "",
            views: t.views ?? 0,
          };
        });

        if (!aborted) {
          setRows(mapped);
          setTotal(json.total || items.length);
          setSummary(json.summary || summary);
        }
      } catch (e) {
        console.error(e);
        if (!aborted) setErrMsg(e.message || "불러오기 실패");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, [page, size, filterStatus]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / size)),
    [total, size]
  );
  const pages = useMemo(
    () => buildPages(page, totalPages, 7),
    [page, totalPages]
  );

  const totalAll =
    summary.NEW + summary.IN_PROGRESS + summary.CANCELED + summary.DONE;

  const statCards = [
    {
      key: "NEW",
      label: STATUS_LABEL.NEW,
      value: summary.NEW,
      icon: "🕒",
      cls: styles.icoWait,
      className: "st_대기"
    },
    {
      key: "IN_PROGRESS",
      label: STATUS_LABEL.IN_PROGRESS,
      value: summary.IN_PROGRESS,
      icon: "🏃",
      cls: styles.icoProgress,
      className: "st_진행"
    },
    {
      key: "CANCELED",
      label: STATUS_LABEL.CANCELED,
      value: summary.CANCELED,
      icon: "⛔",
      cls: styles.icoCancel,
      className: "st_취소"
    },
    {
      key: "DONE",
      label: STATUS_LABEL.DONE,
      value: summary.DONE,
      icon: "✅",
      cls: styles.icoDone,
      className: "st_완료"
    },
    {
      key: "ALL",
      label: "전체",
      value: totalAll,
      icon: "📈",
      cls: styles.icoAll,
    },
  ];

  const handleStatClick = (key) => {
    setFilterStatus(key);
    setPage(1);
  };

  const handleRowClick = (id) => {
    router.push(`/tickets/${id}`);
  };

  return (
    <div className={styles.main_shell}>
      <FullScreenLoader show={loading} text="불러오는 중입니다..." />
      <MainHeader />

      <main className={styles.main_container}>
        <div className={styles.main_titleRow}>
          <h1 className={styles.main_pageTitle}>비전정보통신</h1>
          <button
            className={styles.main_writeBtn}
            onClick={() => router.push("/tickets/new")}
          >
            작성하기
          </button>
        </div>

        {/* 4+1 ô trạng thái */}
        <section className={styles.main_statsCard}>
          {statCards.map((x) => {
            const active = filterStatus === x.key;
            return (
              <button
                key={x.key}
                type="button"
                onClick={() => handleStatClick(x.key)}
                className={
                  active
                    ? `${styles.main_statItem} ${styles.main_statItemActive}`
                    : styles.main_statItem
                }
              >
                <div className={`${styles.main_statIcon} ${x.cls}`}>
                  {x.icon}
                </div>
                <div className={styles.main_statMeta}>
                  <div className={styles.main_statLabel}>{x.label}</div>
                  <div className={styles.main_statValueRow}>
                    <span className={styles.main_statValue}>{x.value}</span>
                    <span className={styles.main_statUnit}>건</span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {/* bảng */}
        <section className={styles.main_card}>
          {errMsg && !loading && (
            <div className={styles.main_error}>오류: {errMsg}</div>
          )}

          <div className={styles.main_tableWrap}>
            {rows.length === 0 ? (
              <table className={styles.main_table}>
                <thead>
                  <tr>
                    <th className={styles.main_colNo}>번호</th>
                    <th className={styles.main_colType}>업무구분</th>
                    <th className={styles.main_colStatus}>상태</th>
                    <th className={styles.main_colTitle}>제목</th>
                    <th className={styles.main_colAuthor}>작성자</th>
                    <th className={styles.main_colAssignee}>담당자</th>
                    <th className={styles.main_colDate}>작성일</th>
                    <th className={styles.main_colViews}>조회수</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 20 }}>
                      등록된 요청이 없습니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className={styles.main_table}>
                <thead>
                  <tr>
                    <th className={styles.main_colNo}>번호</th>
                    <th className={styles.main_colType}>업무구분</th>
                    <th className={styles.main_colStatus}>상태</th>
                    <th className={styles.main_colTitle}>제목</th>
                    <th className={styles.main_colAuthor}>작성자</th>
                    <th className={styles.main_colAssignee}>담당자</th>
                    <th className={styles.main_colDate}>작성일</th>
                    <th className={styles.main_colViews}>조회수</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className={styles.main_clickRow}
                      onClick={() => handleRowClick(r.id)}
                    >
                      <td>{r.id}</td>
                      <td>{r.type}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            r.status === "대기"
                              ? styles.st_대기
                              : r.status === "진행"
                              ? styles.st_진행
                              : r.status === "완료"
                              ? styles.st_완료
                              : r.status === "취소"
                              ? styles.st_취소
                              : ""
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className={styles.main_tdTitle}>{r.title}</td>
                      <td>{r.author}</td>
                      <td>{r.assignee}</td>
                      <td>{r.date}</td>
                      <td>{r.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* phân trang */}
          <div className={styles.main_pagination}>
            {totalPages === 1 ? (
              <button className={styles.pageCurrent}>1</button>
            ) : (
              <>
                {pages[0] > 1 && (
                  <>
                    <button
                      className={
                        page === 1 ? styles.pageCurrent : styles.pageBtn
                      }
                      onClick={() => setPage(1)}
                    >
                      1
                    </button>
                    <span className={styles.ellipsis}>…</span>
                  </>
                )}

                {pages.map((p) => (
                  <button
                    key={p}
                    className={p === page ? styles.pageCurrent : styles.pageBtn}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}

                {pages[pages.length - 1] < totalPages && (
                  <>
                    <span className={styles.ellipsis}>…</span>
                    <button
                      className={
                        page === totalPages
                          ? styles.pageCurrent
                          : styles.pageBtn
                      }
                      onClick={() => setPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
