import "./globals.css";

export const metadata = {
  title: "Vision Ticket System",
  description: "Next.js + Prisma + Neon demo (no NextAuth)",
   icons: {
    // dùng favicon từ site gốc
    icon: "https://vision119.com/ko/images/common/favicon.ico",
    shortcut: "https://vision119.com/ko/images/common/favicon.ico",
   }
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
