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
    if (u) router.replace("/");
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
    <main className={styles.login_shell}>
      <form className={styles.login_card} onSubmit={onSubmit}>
        <h1 className={styles.login_title}>장애 모니터링 로그인</h1>
        <p className={styles.login_sub}>비전정보통신 내부용 티켓 시스템</p>

        <div className={styles.login_field}>
          <input
            className={styles.login_input}
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className={styles.login_field}>
          <input
            className={styles.login_input}
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className={styles.login_options}>
          <label>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{" "}
            자동로그인
          </label>
        </div>

        <button className={styles.login_submit} disabled={loading}>
          {loading ? "로그인 중…" : "로그인"}
        </button>

        {error && <p className={styles.login_error}>{error}</p>}

        <div className={styles.login_linkRow}>
          아직 가입전이신가요?{" "}
          <a href="/register">회원가입</a>
        </div>

        <p className={styles.login_footer}>
          Copyright © (주)비전정보통신 All Rights Reserved.
        </p>
      </form>
    </main>
  );
}
