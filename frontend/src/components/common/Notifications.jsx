import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

export default function Notifications({ user }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const load = async () => {
    if (!user) return;
    const type = (user.role || 'CUSTOMER').toString().toUpperCase();
    const id = user.id || user.userId || user.id;
    try {
      const res = await fetch(`/api/notifications/${type}/${id}`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div className="relative inline-block">
      <button onClick={() => { setOpen(o => !o); if(!open) load(); }} className="p-2 rounded-lg hover:bg-gray-100">
        <Bell size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          <div className="p-3 text-gray-700 font-medium">Notifications</div>
          <div className="max-h-64 overflow-auto">
            {items.length === 0 && <div className="p-3 text-sm text-gray-500">No notifications</div>}
            {items.map(n => (
              <div key={n.notificationId || n.id} className="p-3 border-t last:border-b">
                <div className="text-sm text-gray-800">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
