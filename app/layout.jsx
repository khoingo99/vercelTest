import "./globals.css";

export const metadata = {
  title: "Vision Ticket System",
  description: "Next.js + Prisma + Neon demo (no NextAuth)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
