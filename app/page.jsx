'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userName', data.user.name);

      router.push('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          margin: 'auto',
          padding: 24,
          borderRadius: 12,
          background: '#ffffff',
          width: 340,
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        }}
      >
        <h1 style={{ marginBottom: 4 }}>Đăng nhập</h1>
        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 14, color: '#666' }}>
          Demo Next.js + Prisma + Neon
        </p>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 14 }}>Email</label>
          <input
            style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #ddd' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 14 }}>Mật khẩu</label>
          <input
            style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #ddd' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>
        {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 10,
            marginTop: 8,
            borderRadius: 6,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/register')}
          style={{
            width: '100%',
            padding: 10,
            marginTop: 8,
            borderRadius: 6,
            border: '1px solid #ddd',
            background: '#f9fafb',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Chưa có tài khoản? Đăng ký
        </button>
        <p style={{ fontSize: 12, marginTop: 12, color: '#777' }}>
          Tip: Sau khi migrate bạn có thể đăng ký user mới để test.
        </p>
      </form>
    </div>
  );
}
