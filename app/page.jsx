"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ui/ui.module.css";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    const u = localStorage.getItem("username");
    if (u) router.replace("/home");
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "로그인에 실패했습니다.");
        return;
      }

      localStorage.setItem("userId", String(data.user.id));
      localStorage.setItem("username", data.user.username);
      if (data.user.name) localStorage.setItem("name", data.user.name);
      console.log("remember:", remember);

      router.push("/home");
    } catch (err) {
      console.error(err);
      setError("에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

   return (
    <main className={styles.container}>
      <h1 className={styles.title}>장애 모니터링 로그인</h1>

      <form onSubmit={onSubmit} className={styles.form} aria-label="로그인">
        {/* 아이디 */}
        <div className={styles.field}>
          <input
            className={styles.input}
            placeholder="아이디"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="아이디"
            required
          />
          {username && (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setUsername("")}
              aria-label="지우기"
            >
              ×
            </button>
          )}
        </div>

        {/* 비밀번호 */}
        <div className={styles.field}>
          <input
            className={styles.input}
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="비밀번호"
            required
          />
        </div>

        {/* 자동로그인 */}
        <div className={styles.optionRow}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>자동로그인</span>
          </label>
          <span />
        </div>

        {/* 버튼 로그인 */}
        <button className={styles.submit} disabled={loading}>
          {loading ? "로그인 중…" : "로그인"}
        </button>

        {/* lỗi */}
        {error && <p className={styles.error}>{error}</p>}

        {/* 회원가입 링크 */}
        <div className={styles.signupRow}>
          <span>아직 가입전이신가요?</span>
          <a href="/register" className={styles.signupLink}>
            회원가입
          </a>
        </div>
      </form>

      <footer className={styles.footer}>
        Copyright © (주)비전정보통신 All Rights Reserved.
      </footer>
    </main>
  );
}