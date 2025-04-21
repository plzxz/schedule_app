'use client';
import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hourSlots = Array.from({ length: 10 }, (_, i) => {
  const h = 8 + i;
  return {
    start: `${h.toString().padStart(2, '0')}:00`,
    end: `${(h + 1).toString().padStart(2, '0')}:00`,
  };
});
const colorOptions = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
  '#FCA5A5', '#FCD34D', '#6EE7B7', '#93C5FD', '#C4B5FD', '#F9A8D4'
];

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (m) => {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const min = (m % 60).toString().padStart(2, '0');
  return `${h}:${min}`;
};

function AddEditClassModal({ onClose, onSave, editClass }) {
  const [form, setForm] = useState(editClass || {
    day: 'Mon', start: '09:00', end: '10:00',
    name: '', code: '', room: '', note: '',
    color: colorOptions[0],
  });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    const s = timeToMinutes(form.start);
    const e = timeToMinutes(form.end);
    if (e <= s) return alert("End time must be after start");
    onSave({ ...form, id: editClass?.id || Date.now() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-gray-900 p-6 rounded shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{editClass ? 'Edit Class' : 'Add Class'}</h2>
        <div className="grid grid-cols-2 gap-4">
          <input name="name" value={form.name} onChange={handleChange} className="p-2 bg-gray-800 rounded" placeholder="Subject Name" />
          <input name="code" value={form.code} onChange={handleChange} className="p-2 bg-gray-800 rounded" placeholder="Code" />
          <input name="start" value={form.start} onChange={handleChange} className="p-2 bg-gray-800 rounded" />
          <input name="end" value={form.end} onChange={handleChange} className="p-2 bg-gray-800 rounded" />
          <select name="day" value={form.day} onChange={handleChange} className="p-2 bg-gray-800 rounded">
            {days.map(d => <option key={d}>{d}</option>)}
          </select>
          <input name="room" value={form.room} onChange={handleChange} className="p-2 bg-gray-800 rounded" placeholder="Room" />
          <div className="col-span-2">
            <div className="grid grid-cols-6 gap-1 mt-2">
              {colorOptions.map(color => (
                <div key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-6 h-6 rounded-full border-2 cursor-pointer ${form.color === color ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
        <textarea name="note" value={form.note} onChange={handleChange} className="w-full mt-4 p-2 bg-gray-800 rounded" placeholder="Note" />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
    const [classes, setClasses] = useState([]);
    const [popup, setPopup] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editClass, setEditClass] = useState(null);
    const exportRef = useRef();
  
    const [scheduleName, setScheduleName] = useState("Schedule Name");
    const [showNameEditPopup, setShowNameEditPopup] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState(scheduleName);
  
    const startMin = 8 * 60;
    const endMin = 18 * 60;
    const totalMin = endMin - startMin;
  
    const snap = (min) => Math.round(min / 5) * 5;
  
    const isOverlap = (target, updated) => {
      const s1 = timeToMinutes(updated.start);
      const e1 = timeToMinutes(updated.end);
      return classes.some(c =>
        c.id !== updated.id &&
        c.day === updated.day &&
        !(e1 <= timeToMinutes(c.start) || s1 >= timeToMinutes(c.end))
      );
    };
  
    const handleSaveClass = (cls) => {
      setClasses(prev => {
        const exists = prev.some(c => c.id === cls.id);
        return exists ? prev.map(c => (c.id === cls.id ? cls : c)) : [...prev, cls];
      });
    };
  
    const handleDelete = (id) => {
      setClasses(prev => prev.filter(c => c.id !== id));
      setPopup(null);
    };
  
    const handleResize = (id, side, startX, startTime, endTime) => {
      const move = (e) => {
        const delta = e.clientX - startX;
        const percent = delta / window.innerWidth;
        const minMove = snap((percent * totalMin));
  
        setClasses(prev => prev.map(c => {
          if (c.id !== id) return c;
          let start = timeToMinutes(c.start);
          let end = timeToMinutes(c.end);
  
          if (side === 'left') start = Math.min(end - 5, Math.max(startMin, startTime + minMove));
          if (side === 'right') end = Math.max(start + 5, Math.min(endMin, endTime + minMove));
  
          const updated = { ...c, start: minutesToTime(start), end: minutesToTime(end) };
          return isOverlap(c, updated) ? c : updated;
        }));
      };
  
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
  
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };
  
    const handleDrag = (id, startX, startY, originDay, originStart, originEnd) => {
      const move = (e) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const deltaMin = snap((dx / window.innerWidth) * totalMin);
        const rowHeight = 80;
        const dayIndex = days.indexOf(originDay);
        const newIndex = Math.min(6, Math.max(0, dayIndex + Math.round(dy / rowHeight)));
        const newDay = days[newIndex];
  
        setClasses(prev => prev.map(c => {
          if (c.id !== id) return c;
  
          const newStart = Math.max(startMin, Math.min(endMin - 5, originStart + deltaMin));
          const newEnd = Math.max(newStart + 5, Math.min(endMin, originEnd + deltaMin));
  
          const updated = {
            ...c,
            day: newDay,
            start: minutesToTime(newStart),
            end: minutesToTime(newEnd),
          };
  
          return isOverlap(c, updated) ? c : updated;
        }));
      };
  
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
  
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };
  
    const handleExport = async () => {
      if (!exportRef.current) return;
      const node = exportRef.current;
  
      try {
        const dataUrl = await toPng(node, {
          cacheBust: true,
          backgroundColor: '#101828',
          width: node.scrollWidth,
          canvasWidth: node.scrollWidth,
        });
        const link = document.createElement('a');
        link.download = 'schedule.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Export failed:', err);
        alert('Failed to export image. Try again.');
      }
    };
  
    useEffect(() => {
        const close = () => setPopup(null);
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
      }, []);

      const shortDayName = (full) => {
        const map = {
          Monday: 'Mon',
          Tuesday: 'Tue',
          Wednesday: 'Wed',
          Thursday: 'Thu',
          Friday: 'Fri',
          Saturday: 'Sat',
          Sunday: 'Sun',
        };
        return map[full] || full;
      };
    
      const loadSchedule = async () => {
        const stored = localStorage.getItem('user');
        if (!stored) {
          alert('Not logged in');
          return;
        }
      
        const { username } = JSON.parse(stored);
        const number = Number(new URLSearchParams(window.location.search).get('id'));
        if (!number || isNaN(number)) {
          alert('Invalid slot ID');
          return;
        }
      
        try {
          const res = await fetch(`/api/schedule?username=${username}&number=${number}`);
          const data = await res.json();
      
          if (!res.ok) {
            throw new Error(data.error || 'Load failed');
          }
      
          console.log('Loaded data:', data);
          
          setScheduleName(data.name || 'Schedule Name');
      
          const loadedClasses = [];
      
          for (const [dayName, entries] of Object.entries(data.days)) {
            entries
              .filter(cls => cls.isUsed)
              .sort((a, b) => a.slot_index - b.slot_index)
              .forEach(cls => {
                loadedClasses.push({
                  id: cls.id,
                  day: shortDayName(dayName), // convert to Mon/Tue/etc
                  name: cls.name || '',
                  code: cls.code || '',
                  room: cls.room || '',
                  start: cls.start || '',
                  end: cls.end || '',
                  color: cls.color || '',
                  note: cls.note || '',
                  slot_index: cls.slot_index || 0,
                });
              });
          }
      
          setClasses(loadedClasses);
        } catch (err) {
          console.error(err);
          alert('Error loading schedule');
        }
      };
    
      const handleSave = async () => {
        const stored = localStorage.getItem('user');
        if (!stored) {
          alert('Not logged in');
          return;
        }
      
        const { username } = JSON.parse(stored);
        const number = Number(new URLSearchParams(window.location.search).get('id'));
        if (!number || isNaN(number)) {
          alert('Invalid slot ID');
          return;
        }
      
        // Convert grouped day/class structure into a flat array of classes
        const allClasses = Array.isArray(classes) ? classes.map((c, i) => ({
          day: c.day,
          name: c.name,
          code: c.code,
          room: c.room,
          start: c.start,
          end: c.end,
          color: c.color,
          note: c.note,
          isUsed: true,
          slot_index: c.slot_index ?? i
        })) : [];

        //debug
        console.log({
          username,
          number,
          name: scheduleName,
          classes: classes
        });
      
        try {
          const res = await fetch('/api/schedule/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              number,
              name: scheduleName,
              classes: allClasses
            })
          });
      
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Save failed');
      
          alert('Schedule saved successfully!');
        } catch (err) {
          console.error(err);
          alert('Error saving schedule');
        }
      };      
  
  useEffect(() => { loadSchedule(); }, []);
    
      return (
        <div className="min-h-screen bg-gray-800 text-white p-6">
          <div className="max-w-7xl mx-auto bg-gray-900 p-6 rounded-xl shadow-lg">
            {/* Header */}
            <div className="relative h-12 mb-4">
              <button
                onClick={() => window.location.href = '/menu'}
                className="absolute left-0 top-1 text-xl p-2 text-gray-300 hover:text-white"
              >
                ←
              </button>
    
              <div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNameEditPopup(true);
                }}
              >
                {scheduleName}
    
                {showNameEditPopup && !editingName && (
                  <div
                    className="absolute top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm shadow"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingName(true);
                      setNewName(scheduleName);
                      setShowNameEditPopup(false);
                    }}
                  >
                    Edit
                  </div>
                )}
    
                {editingName && (
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-4 rounded-md shadow border border-gray-600 z-50 w-[220px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full p-2 mb-2 bg-gray-700 rounded text-white"
                      autoFocus
                    />
                    <div className="flex justify-between">
                      <button
                        onClick={() => {
                          if (newName.trim()) setScheduleName(newName.trim());
                          setEditingName(false);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
    
              <button
                onClick={() => {
                  setEditClass(null);
                  setShowModal(true);
                }}
                className="absolute right-0 top-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
              >
                Add Class
              </button>
            </div>
    
            {/* Export container */}
            <div ref={exportRef} className="inline-block p-6 bg-[#101828] rounded-md">
          <div className="overflow-x-auto w-full relative">
            <div className="grid grid-cols-[100px_1fr] border-b border-gray-700 text-sm text-gray-400">
              <div className="p-2">Day / Time</div>
              <div className="grid grid-cols-10 gap-x-1">
                {hourSlots.map(({ start, end }) => (
                  <div key={start} className="p-2 border-l border-gray-700 text-center">
                    {start} - {end}
                  </div>
                ))}
              </div>
            </div>

            {days.map((day) => (
              <div key={day} className="grid grid-cols-[100px_1fr] border-t border-gray-700 relative h-20">
                <div className="p-2 text-sm text-gray-300">{day}</div>
                <div className="relative w-full">
                  <div className="absolute inset-0 grid grid-cols-10 gap-x-1">
                    {hourSlots.map((_, i) => (
                      <div key={i} className="border-l border-gray-700 h-full relative px-1" />
                    ))}
                  </div>

                  {classes.filter(c => c.day === day).map(c => {
                    const start = timeToMinutes(c.start);
                    const end = timeToMinutes(c.end);
                    const left = ((start - startMin) / totalMin) * 100;
                    const width = ((end - start) / totalMin) * 100;

                    return (
                      <div
                        key={c.id}
                        className="absolute top-0 bottom-0 text-white text-xs px-2 py-1 rounded shadow-md flex flex-col justify-center items-center text-center cursor-move"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          backgroundColor: c.color || '#8B5CF6',
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          handleDrag(c.id, e.clientX, e.clientY, c.day, start, end);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopup({ id: c.id, day, left, width });
                        }}
                      >
                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            handleResize(c.id, 'left', e.clientX, start, end);
                          }}
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10"
                        />
                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            handleResize(c.id, 'right', e.clientX, start, end);
                          }}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10"
                        />

                        <strong>{c.name}</strong>
                        <div>{c.code}</div>
                        <div>{c.room}</div>
                        <div>{c.start} - {c.end}</div>
                      </div>
                    );
                  })}

                  {popup && popup.day === day && (
                    <div
                      className="absolute -top-10 z-10 bg-gray-700/90 border border-gray-500 px-2 py-1 rounded text-xs shadow"
                      style={{
                        left: `calc(${popup.left}% + ${popup.width / 2}%)`,
                        transform: 'translateX(-50%)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="text-blue-300 hover:text-white mr-3"
                        onClick={() => {
                          const target = classes.find(c => c.id === popup.id);
                          setEditClass(target);
                          setShowModal(true);
                          setPopup(null);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-300 hover:text-white"
                        onClick={() => handleDelete(popup.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between mt-6">
          <button onClick={handleSave} className="bg-blue-600 px-4 py-2 rounded">Save</button>
          <button
            onClick={handleExport}
            className="bg-yellow-600 px-4 py-2 rounded"
          >
            Export
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <AddEditClassModal
          onClose={() => {
            setShowModal(false);
            setEditClass(null);
          }}
          onSave={handleSaveClass}
          editClass={editClass}
        />
      )}
    </div>
  );
}
