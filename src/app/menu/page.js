'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MenuPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('/avatar.png');

  const [newNickname, setNewNickname] = useState('');
  const [newAvatar, setNewAvatar] = useState('');

  const [editingNickname, setEditingNickname] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [showEditNicknamePopup, setShowEditNicknamePopup] = useState(false);
  const [showEditAvatarPopup, setShowEditAvatarPopup] = useState(false);

  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }

    const { username } = JSON.parse(stored);
    setUsername(username);

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/menu?username=${username}`);
        const data = await res.json();
        setNickname(data.name || username);
        setAvatar(data.image || '/placehold.png');
        setSchedules(data.schedules || []);
      } catch (err) {
        console.error('Failed to fetch user data', err);
        router.push('/login');
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleEdit = (id) => {
    router.push(`/schedule?id=${id}`);
  };

  const handleDelete = async (id) => {
    await fetch('/api/menu/delete-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleId: id }),
    });

    setSchedules(prev =>
      prev.map(s => (s.id === id ? { ...s, isUsed: false, name: '' } : s))
    );
  };

  const handleCreate = async (id) => {
    await fetch('/api/menu/create-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleId: id }),
    });

    router.push(`/schedule?id=${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center p-6">
      <div className="flex w-[900px] h-[460px] rounded-xl shadow-xl overflow-hidden border border-gray-800">

        {/* LEFT: Profile Panel */}
        <div className="w-1/3 bg-gray-900 p-6 flex flex-col items-center justify-start">
          <div className="flex flex-col items-center mt-10 relative">
            <div className="relative">
              <img
                src={avatar}
                alt="avatar"
                className="w-32 h-32 rounded-full border-2 border-white cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditAvatarPopup(true);
                }}
              />
              {showEditAvatarPopup && !editingAvatar && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-700 text-sm px-3 py-1 rounded shadow border border-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditAvatarPopup(false);
                    setEditingAvatar(true);
                    setNewAvatar(avatar);
                  }}
                >
                  Edit
                </div>
              )}
              {editingAvatar && (
                <div className="absolute top-36 left-1/2 -translate-x-1/2 bg-gray-800 p-4 rounded-md shadow border border-gray-600 z-10 w-[220px]">
                  <input
                    type="text"
                    className="w-full p-1 rounded bg-gray-700 text-white mb-2"
                    value={newAvatar}
                    onChange={(e) => setNewAvatar(e.target.value)}
                    placeholder="Enter image URL"
                    autoFocus
                  />
                  <div className="flex justify-between text-sm">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (newAvatar.trim()) {
                          await fetch('/api/menu/image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, image: newAvatar.trim() }),
                          });
                          setAvatar(newAvatar.trim());
                        }
                        setEditingAvatar(false);
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAvatar(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative mt-6">
              {!editingNickname ? (
                <>
                  <h2
                    className="text-xl font-bold cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditNicknamePopup(true);
                    }}
                  >
                    {nickname}
                  </h2>
                  {showEditNicknamePopup && (
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-700 text-sm px-3 py-1 rounded shadow border border-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditNicknamePopup(false);
                        setEditingNickname(true);
                        setNewNickname(nickname);
                      }}
                    >
                      Edit
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-800 p-4 rounded-md shadow border border-gray-600 z-10 w-[220px]">
                  <input
                    type="text"
                    className="w-full p-1 rounded bg-gray-700 text-white mb-2"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-between text-sm">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (newNickname.trim()) {
                          await fetch('/api/menu/nickname', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, name: newNickname.trim() }),
                          });
                          setNickname(newNickname.trim());
                        }
                        setEditingNickname(false);
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNickname(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-300">{`@${username}`}</p>
          </div>

          <div className="mt-auto w-full">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 mt-8 rounded w-full"
            >
              Logout
            </button>
          </div>
        </div>

        {/* RIGHT: Schedule Panel */}
        <div className="w-2/3 bg-gray-700 px-4 py-4 flex flex-col gap-2 justify-center h-full">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-gray-900 shadow-xl p-4 rounded-xl h-[40%] flex items-center justify-center"
            >
              {schedule.isUsed ? (
                <div className="flex justify-between items-center w-full">
                  <span className="text-lg font-medium">{schedule.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(schedule.number)}
                      className="w-[72px] h-[32px] bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.number)}
                      className="w-[72px] h-[32px] bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleCreate(schedule.number)}
                  className="text-3xl font-bold text-white bg-gray-800 w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-700"
                  title="Create new schedule"
                >
                  +
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

//  {/* Credit Page Link */}
//  <button
//  onClick={() => router.push('/credit')}
//  className="fixed bottom-4 left-4 w-15 h-15 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-xl font-bold shadow-lg"
//  title="Credits"
// >
//  ?
// </button>