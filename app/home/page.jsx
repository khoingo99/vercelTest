"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../ui/ui.module.css";
import MainHeader from "../components/MainHeader";
import FullScreenLoader from "../components/FullScreenLoader";

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

  const [rows, setRows] = useState([]);        // tất cả ticket trên page hiện tại
  const [total, setTotal] = useState(0);       // tổng số ticket (tất cả page)

  const [summary, setSummary] = useState({
    NEW: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    HOLD: 0,
    CANCELED: 0,
    DONE: 0,
  });

  const [filterStatus, setFilterStatus] = useState("ALL"); // NEW / IN_PROGRESS / CANCELED / DONE / ALL
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState(null);

  // nếu chưa login -> đá về trang login ("/")
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) router.replace("/");
  }, [router]);

  useEffect(() => {
    let aborted = false;

    async function load() {
      try {
        setLoading(true);
        setErrMsg(null);

        const res = await fetch(`/api/tickets?page=${page}&size=${size}`, {
          cache: "no-store",
        });
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

        // tự tính summary theo status
        const sm = {
          NEW: 0,
          ASSIGNED: 0,
          IN_PROGRESS: 0,
          REVIEW: 0,
          HOLD: 0,
          CANCELED: 0,
          DONE: 0,
        };
        items.forEach((t) => {
          const s = t.status || "NEW";
          if (sm[s] != null) sm[s] += 1;
        });

        if (!aborted) {
          setRows(mapped);
          setTotal(json.total || items.length);
          setSummary(sm);
        }
      } catch (e) {
        if (!aborted) setErrMsg(e.message || "불러오기 실패");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, [page, size]);

  // danh sách rows sau khi lọc theo trạng thái
  const rowsView = useMemo(() => {
    if (filterStatus === "ALL") return rows;
    return rows.filter((r) => r.rawStatus === filterStatus);
  }, [rows, filterStatus]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / size)),
    [total, size]
  );
  const pages = useMemo(
    () => buildPages(page, totalPages, 7),
    [page, totalPages]
  );

  // dữ liệu cho 4 ô trạng thái + 1 ô 전체
  const stats = [
    {
      key: "NEW",
      label: "대기 업무",
      value: summary.NEW,
      icon: "🕒",
      cls: styles.icoWait,
    },
    {
      key: "IN_PROGRESS",
      label: "처리 중인 업무",
      value: summary.IN_PROGRESS,
      icon: "🏃",
      cls: styles.icoProgress,
    },
    {
      key: "CANCELED",
      label: "취소",
      value: summary.CANCELED,
      icon: "⛔",
      cls: styles.icoCancel,
    },
    {
      key: "DONE",
      label: "완료",
      value: summary.DONE,
      icon: "✅",
      cls: styles.icoDone,
    },
    {
      key: "ALL",
      label: "전체",
      value: total,
      icon: "📈",
      cls: styles.icoAll,
    },
  ];
  return (
    <div className={styles.main_shell}>
      <MainHeader />
      <FullScreenLoader show={loading} text="로딩 중입니다..." />
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

        {/* 4 trạng thái + 전체 – chia đều, click để lọc */}
        <section className={styles.main_statsCard}>
          {stats.map((x) => (
            <button
              key={x.key}
              type="button"
              className={`${styles.main_statItem} ${
                filterStatus === x.key ? styles.main_statItemActive : ""
              }`}
              onClick={() => setFilterStatus(x.key)}
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
          ))}
        </section>

        <section className={styles.main_card}>
          <div className={styles.main_toolbar}>
            <div className={styles.main_filters}>
              <select className={styles.main_select}>
                <option>정렬순서 선택</option>
              </select>
              <input
                className={styles.main_titleInput}
                placeholder="제목"
                readOnly
              />
              <div className={styles.main_searchBox}>
                <input
                  className={styles.main_keyword}
                  placeholder="검색어를 입력하세요"
                  readOnly
                />
                <button className={styles.main_searchBtn}>검색</button>
              </div>
            </div>
          </div>

          <div className={styles.main_tableWrap}>
            {loading ? (
              <div className={styles.main_loading}>불러오는 중…</div>
            ) : errMsg ? (
              <div className={styles.main_error}>오류: {errMsg}</div>
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
                  {rowsView.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 20 }}>
                        등록된 요청이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    rowsView.map((r) => (
                      <tr
                        key={r.id}
                        className={styles.main_rowClickable}
                        onClick={() => router.push(`/tickets/${r.id}`)}
                      >
                        <td>{r.id}</td>
                        <td>{r.type}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              styles["st_" + r.status]
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>

                        {/* nếu chỉ muốn click vào tiêu đề thì thêm stopPropagation */}
                        <td className={styles.main_tdTitle}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // không trigger onClick của <tr>
                              router.push(`/tickets/${r.id}`);
                            }}
                          >
                            {r.title}
                          </a>
                        </td>

                        <td>{r.author}</td>
                        <td>{r.assignee}</td>
                        <td>{r.date}</td>
                        <td>{r.views}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

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
