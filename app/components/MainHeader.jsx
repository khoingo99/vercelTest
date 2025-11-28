"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../ui/ui.module.css";
import logo from "../components/vision_logo.png";
import ProfileModal from "./ProfileModal";

export default function MainHeader() {
  const [showProfile, setShowProfile] = useState(false);
  const [name, setName] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Lấy tên từ localStorage khi load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedName = localStorage.getItem("name");
    if (storedName) setName(storedName);
  }, []);

  const handleLogoClick = () => {
    router.push("/home"); // trang home
  };

  const handleEditProfile = () => {
    setShowProfile(true);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("name");
      localStorage.removeItem("email");
      localStorage.removeItem("phone");
      localStorage.removeItem("department");
      localStorage.removeItem("position");
    }
    router.push("/"); // trang login
  };

  return (
    <>
      <header className={styles.header_wrapper}>
        {/* thanh nâu phía trên */}
        <div className={styles.header_barTop} />

        {/* header chính */}
        <div className={styles.header_shell}>
          <div className={styles.header_inner}>
            <button
              type="button"
              className={styles.header_logo}
              onClick={handleLogoClick}
            >
              <Image src={logo} alt="VISION" width={100} height={50} priority />
            </button>

            <nav className={styles.header_nav}>
              {name && (
                <span className={styles.header_username}>{name}</span>
              )}

              <button
                type="button"
                className={
                  pathname === "/profile"
                    ? `${styles.header_link} ${styles.header_linkActive}`
                    : styles.header_link
                }
                onClick={handleEditProfile}
              >
                회원 정보 수정
              </button>

              <button
                type="button"
                className={styles.header_link}
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Popup sửa thông tin */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onUpdated={(user) => {
            // cập nhật lại tên hiển thị ở header sau khi sửa
            setName(user.name || "");
          }}
        />
      )}
    </>
  );
}
