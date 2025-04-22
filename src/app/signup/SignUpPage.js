'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
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

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const checkRes = await fetch(`/api/users/check?username=${encodeURIComponent(username)}`);
      const checkData = await checkRes.json();
      if (checkData.exists) {
        alert("Username already exists");
        return;
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Registration failed.');
        return;
      }

      window.location.href = '/login';
    } catch (err) {
      console.error('Signup error:', err);
      alert('Something went wrong. Try again.');
    }
  };

  return (
    <main className="flex items-center justify-center h-screen bg-gray-800">
      <div className="bg-gray-900 shadow-xl p-10 rounded-xl w-full max-w-md text-white h-[500px] flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-center mb-6">My Schedule</h1>
          <p className="text-lg text-center mb-8">Register</p>

          <div className="space-y-7">
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

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded focus:outline-none"
            />
          </div>
        </div>

        <div>
          <button
            onClick={handleRegister}
            className="w-full py-2 bg-green-600 hover:bg-green-700 rounded font-semibold mt-6"
          >
            Register
          </button>

          <p className="text-center text-sm mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
