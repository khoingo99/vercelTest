'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');

    if (!email) {
      router.push('/');
      return;
    }

    setUserEmail(email);
    setUserName(name || email);

    async function fetchPosts() {
      try {
        const res = await fetch(`/api/posts?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setPosts(data.posts);
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    router.push('/');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
        }}
      >
        <div>
          <strong>Blog Dashboard</strong>
        </div>
        <div>
          {userName && (
            <span style={{ marginRight: 12, fontSize: 14 }}>Xin chào, {userName}</span>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #ef4444',
              background: '#fee2e2',
              color: '#b91c1c',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Danh sách bài viết của bạn</h2>
        {loading ? (
          <p>Đang tải...</p>
        ) : posts.length === 0 ? (
          <p>Chưa có bài viết nào. (Demo: sau khi đăng ký mình tạo 2 bài mẫu cho bạn)</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: 12,
              background: '#ffffff',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            }}
          >
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'left',
                    padding: 8,
                    fontSize: 14,
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'left',
                    padding: 8,
                    fontSize: 14,
                  }}
                >
                  Tiêu đề
                </th>
                <th
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'left',
                    padding: 8,
                    fontSize: 14,
                  }}
                >
                  Ngày tạo
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p, idx) => (
                <tr key={p.id}>
                  <td
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      padding: 8,
                      fontSize: 14,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      padding: 8,
                      fontSize: 14,
                    }}
                  >
                    {p.title}
                  </td>
                  <td
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      padding: 8,
                      fontSize: 14,
                    }}
                  >
                    {new Date(p.createdAt).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
