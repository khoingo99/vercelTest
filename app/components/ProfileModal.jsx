// app/components/ProfileModal.jsx
"use client";

import { useEffect, useState } from "react";
import styles from "../ui/ui.module.css";
import FullScreenLoader from "../components/FullScreenLoader";

export default function ProfileModal({ onClose, onUpdated }) {
  const [form, setForm] = useState({
    id: "",
    username: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 사용자 데이터 다시 로딩
  useEffect(() => {
    async function loadProfile() {
      try {
        setError("");
        setLoading(true);
        if (typeof window === "undefined") return;
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setError("로그인이 필요합니다.");
          return;
        }
        const res = await fetch(`/api/auth/profile?id=${userId}`);
        const json = await res.json();
        if (!res.ok || json.ok === false) {
          throw new Error(json.message || "정보를 불러오지 못했습니다.");
        }
        const u = json.user;
        setForm({
          id: u.id,
          username: u.username || "",
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          department: u.department || "",
          position: u.position || "",
        });
      } catch (e) {
        console.error(e);
        setError(e.message || "정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        return;
      }
    }
    try {
      setLoading(true);
      const payload = {
        id: form.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        position: form.position,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      };
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        throw new Error(json.message || "회원정보 수정에 실패했습니다.");
      }
      setSuccessMsg("회원정보가 수정되었습니다.");
      alert("수정되었습니다.");   
      onClose();
      // localStorage 업데이트
      if (typeof window !== "undefined") {
        localStorage.setItem("name", json.user.name || "");
        localStorage.setItem("email", json.user.email || "");
        localStorage.setItem("phone", json.user.phone || "");
        localStorage.setItem("department", json.user.department || "");
        localStorage.setItem("position", json.user.position || "");
      }
      if (onUpdated) onUpdated(json.user);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      console.error(e);
      setError(e.message || "회원정보 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className={styles.profile_modal_backdrop}>
    <FullScreenLoader show={loading} text="로딩 중입니다..." />
      <div className={styles.profile_modal}>
        <div className={styles.profile_modal_header}>
          <h2 className={styles.profile_modal_title}>회원 정보 수정</h2>
          <button
            type="button"
            className={styles.profile_modal_closeBtn}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.profile_modal_row}>
            <label className={styles.signup_label}><span className={styles.signup_req} /> 아이디 / 이름</label>
            <div className={styles.signup_fieldRow}>
                <input
                className={styles.signup_input}
                value={form.username}
                disabled
                />
                <input
                className={styles.signup_input}
                value={form.name}
                onChange={handleChange("name")}
                required
                />
             </div>
          </div>
          {/* 현재 비밀번호 */}
          <div className={styles.profile_modal_row}>
            <label className={styles.signup_label}><span className={styles.signup_req} /> 현재 비밀번호</label>
            <input
              type="password"
              className={styles.signup_input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="비밀번호 변경 시 필수 입력"
            />
          </div>
          {/* 새 비밀번호 */}
          <div className={styles.profile_modal_row}>
            <label className={styles.signup_label}>새 비밀번호</label>
            <input
              type="password"
              className={styles.signup_input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="변경하지 않으려면 비워 두세요"
            />
            <div className={styles.profile_modal_help}>
               - 영문자, 숫자, 특수문자를 포함하여 8~16자로 입력해주세요.
            </div>
          </div>
          {/* 비밀번호 확인 */}
          <div className={styles.profile_modal_row}>
            <label className={styles.signup_label}>비밀번호 확인</label>
            <input
              type="password"
              className={styles.signup_input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {/* 이메일 */}
          <div className={styles.profile_modal_row}>
            <label className={styles.signup_label}><span className={styles.signup_req} /> 이메일</label>
            <input
              type="email"
              className={styles.signup_input}
              value={form.email}
              onChange={handleChange("email")}
              required
            />
          </div>
          {/* 전화번호 */}
          <div className={styles.profile_modal_row}>
            <label className={styles.signup_label}><span className={styles.signup_req} /> 전화번호</label>
            <input
              className={styles.signup_input}
              value={form.phone}
              onChange={handleChange("phone")}
              required
            />
          </div>
          {/* 부서 / 직위 */}
          <div className={styles.profile_modal_row}>
            <label className={styles.signup_label}><span className={styles.signup_req} /> 부서 / 직위</label>
            <div className={styles.signup_fieldRow}>
              <input
                className={styles.signup_input}
                value={form.department}
                onChange={handleChange("department")}
                placeholder="부서"
                required
              />
              <input
                className={styles.signup_input}
                value={form.position}
                onChange={handleChange("position")}
                placeholder="직위"
                required
              />
            </div>
          </div>
          {error && <div className={styles.profile_modal_error}>{error}</div>}
          {successMsg && (
            <div className={styles.profile_modal_success}>{successMsg}</div>
          )}
          <div className={styles.profile_modal_actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
