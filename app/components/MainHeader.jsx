"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../ui/ui.module.css";
import logo from "../components/vision_logo.png";

export default function MainHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setUsername] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("name");
    if (u) setUsername(u);
  }, []);

  const handleLogoClick = () => {
    router.push("/home"); // trang home chính, nếu bạn dùng "/" thì đổi lại
  };

  const handleEditProfile = () => {
    // tạm thời cho sang trang /profile (bạn có thể đổi sang trang khác)
    router.push("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("name");

    router.push("/"); // trang login
  };

  return (
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
              <span className={styles.header_username}>
                {name}
              </span>
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
  );
}
