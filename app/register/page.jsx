"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../ui/ui.module.css";
import FullScreenLoader from "../../components/FullScreenLoader";

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== password2) {
      setError("비밀번호가 동일하지 않습니다.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, email, phone, password,department,position }),
      });

      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.message || "회원가입에 실패했습니다.");
        return;
     }

      // login ngay sau khi register
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.success) {
        localStorage.setItem("userId", String(loginData.user.id));
        localStorage.setItem("username", loginData.user.username);
        if (loginData.user.name)
          localStorage.setItem("name", loginData.user.name);
      }

      router.push("/");
    } catch (err) {
      console.error(err);
      setError("에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.signup_wrap}>
      <h1 className={styles.signup_title}>회원가입</h1>

      <form onSubmit={onSubmit} className={styles.signup_form}>
        <div className={styles.signup_hrTitle}>
          <span className={styles.signup_req} />
          표시는 반드시 입력하셔야 합니다.
        </div>

        <div className={styles.signup_row}>
          <div className={styles.signup_label}>
            <span className={styles.signup_req} />
            아이디
          </div>
          <div className={styles.signup_fieldCol}>
            <input
              className={styles.signup_input}
              placeholder="아이디을 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className={styles.signup_help}>
              - ID는 4~16자의 영문자나 숫자를 조합하여 만들 수 있으며, 한글이나
              특수문자 등은 사용할 수 없습니다.
            </div>
          </div>
        </div>

        {/* 비밀번호 */}
        <div className={styles.signup_row}>
          <label className={styles.signup_label}>
            <span className={styles.signup_req} />
            비밀번호
          </label>

          <div className={styles.signup_fieldCol}>
            <input
              type="password"
              className={styles.signup_input}
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className={styles.signup_help}>
              - 영문자, 숫자, 특수문자 중 임의로 8자에서 16자까지 조합<br/>
              - 대소문자를 구분하오니 입력시 대소문자의 상태를 확인 하시기 바랍니다.
            </div>
          </div>
        </div>
        <div className={styles.signup_row}>
          <div className={styles.signup_label}>
            <span className={styles.signup_req} />
            비밀번호 확인
          </div>
          <div className={styles.signup_fieldCol}>
            <input
              className={styles.signup_input}
              placeholder="비밀번호 확인를 입력해주세요"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.signup_row}>
          <div className={styles.signup_label}>
            <span className={styles.signup_req} />
            이름
          </div>
          <div className={styles.signup_fieldCol}>
            <input
              className={styles.signup_input}
              placeholder="이름를 입력해주세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.signup_row}>
          <div className={styles.signup_label}>
            <span className={styles.signup_req} />
            이메일
          </div>
          <div className={styles.signup_fieldCol}>
            <input
              className={styles.signup_input}
              placeholder="이메일를 입력해주세요"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.signup_row}>
          <div className={styles.signup_label}>
            <span className={styles.signup_req} />
            전화번호
          </div>
          <div className={styles.signup_fieldCol}>
            <input
              className={styles.signup_input}
              type="tel"
              placeholder="전화번호를 입력해주세요"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              required
            />
          </div>
        </div>
        {/* 부서 / 직위 */}
        <div className={styles.signup_row}>
          <div className={styles.signup_label}>
            <span className={styles.signup_req} />
            부서 / 직위
          </div>

          <div className={styles.signup_fieldRow}>
            <div className={styles.signup_fieldCol}>
              <input
                className={styles.signup_input}
                placeholder="부서를 입력해주세요"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>
            <div className={styles.signup_fieldCol}>
              <input
                className={styles.signup_input}
                placeholder="직위를 입력해주세요"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {error && <p className={styles.textError}>{error}</p>}

        <div className={styles.signup_actions}>
          <a href="/" className={styles.btnSecondary}>
            취소
          </a>
          <button className={styles.btnPrimary} disabled={loading}>
            {loading ? "처리 중…" : "회원가입"}
          </button>
        </div>
      </form>
    </main>
  );
}
