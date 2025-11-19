import './globals.css';

export const metadata = {
  title: 'Blog Dashboard - Prisma + Neon Demo',
  description: 'Demo Next.js + Prisma + Neon + Vercel',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
