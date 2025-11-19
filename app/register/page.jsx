'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      alert('Đăng ký thành công! Hãy đăng nhập.');
      router.push('/');
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
        <h1 style={{ marginBottom: 4 }}>Đăng ký</h1>
        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 14, color: '#666' }}>
          Tạo tài khoản mới
        </p>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 14 }}>Tên hiển thị</label>
          <input
            style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #ddd' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
          />
        </div>
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
            background: '#16a34a',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
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
          Quay lại đăng nhập
        </button>
      </form>
    </div>
  );
}
