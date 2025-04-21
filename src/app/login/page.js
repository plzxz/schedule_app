'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRemember(true);
    }
  }, []);

  const handleLogin = async () => {
    const invalidChars = [' ', ';'];

    if (!username || !password) {
      alert('All fields are required.');
      return;
    }

    if (invalidChars.some(c => username.includes(c))) {
      alert("Username cannot contain space or ';'");
      return;
    }

    if (invalidChars.some(c => password.includes(c))) {
      alert("Password cannot contain space or ';'");
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Login failed');
        return;
      }

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(data));
      if (remember) {
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      window.location.href = '/menu';
    } catch (err) {
      console.error('Login error:', err);
      alert('Something went wrong. Try again.');
    }
  };

  return (
    <main className="flex items-center justify-center h-screen bg-gray-800">
      <div className="bg-gray-900 shadow-xl p-10 rounded-xl w-full max-w-md text-white h-[460px] flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-center mb-4">My Schedule</h1>
          <p className="text-lg text-center mb-8">Login</p>

          <div className="space-y-5">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded focus:outline-none"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded focus:outline-none"
            />

            <label className="flex items-center text-sm mt-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="mr-2"
              />
              Remember me
            </label>
          </div>
        </div>

        <div>
          <button
            onClick={handleLogin}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold mt-6"
          >
            Login
          </button>

          <p className="text-center text-sm mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
