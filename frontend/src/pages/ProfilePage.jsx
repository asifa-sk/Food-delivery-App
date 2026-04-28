import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, User, Mail, Phone, MapPin, Edit2, Save, X, Package, Heart, Tag } from "lucide-react";
import NavbarWithCart from "../components/common/NavbarWithCart";
import CartSidebar from "../components/common/CartSidebar";
import { useAuth } from "../hooks/useAuth";
import { fetchCustomerOrders } from "../api/orderApi";

const parseCustomerIdFromToken = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split("-");
  if (parts.length < 4) return null;
  const maybeId = Number(parts[2]);
  return Number.isFinite(maybeId) ? maybeId : null;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const customerId = user?.id || parseCustomerIdFromToken(localStorage.getItem("token"));

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [saved, setSaved] = useState(false);
  const [orderStats, setOrderStats] = useState({ total: 0, delivered: 0, totalSpent: 0 });

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      try { setForm(JSON.parse(storedProfile)); } catch { /* ignore */ }
    } else {
      setForm({ name: user?.name || user?.email?.split("@")[0] || "", phone: "", address: "" });
    }
  }, [user]);

  useEffect(() => {
    if (!customerId) return;
    fetchCustomerOrders(customerId)
      .then((res) => {
        const orders = Array.isArray(res.data) ? res.data : [];
        const delivered = orders.filter((o) => o.status === "DELIVERED").length;
        const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        setOrderStats({ total: orders.length, delivered, totalSpent });
      })
      .catch(() => {/* ignore */});
  }, [customerId]);

  const handleSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(form));
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const displayName = form.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-surface-50">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="p-2 rounded-xl hover:bg-gray-200 transition text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
        </div>

        {/* Avatar Card */}
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl font-black">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-black">{displayName}</h2>
              <p className="text-white/80 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Orders", value: orderStats.total, color: "text-blue-600", bg: "bg-blue-50", icon: <Package size={20} className="text-blue-500" /> },
            { label: "Delivered", value: orderStats.delivered, color: "text-green-600", bg: "bg-green-50", icon: <Package size={20} className="text-green-500" /> },
            { label: "Total Spent", value: `₹${orderStats.totalSpent.toFixed(0)}`, color: "text-brand-600", bg: "bg-brand-50", icon: <Tag size={20} className="text-brand-500" /> },
          ].map((stat) => (
            <div key={stat.label} className={"rounded-2xl p-4 text-center " + stat.bg}>
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <p className={"text-xl font-black " + stat.color}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Personal Information</h3>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 text-sm text-brand-500 font-semibold hover:text-brand-600">
                <Edit2 size={14} /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditMode(false)} className="flex items-center gap-1 text-sm text-gray-500 font-semibold hover:text-gray-700">
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} className="flex items-center gap-1 text-sm text-green-600 font-semibold hover:text-green-700">
                  <Save size={14} /> Save
                </button>
              </div>
            )}
          </div>

          <div className="p-5 space-y-5">
            <ProfileField
              icon={<User size={18} className="text-brand-400" />}
              label="Full Name"
              value={form.name}
              editMode={editMode}
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="Enter your name"
            />
            <ProfileField
              icon={<Mail size={18} className="text-brand-400" />}
              label="Email Address"
              value={user?.email || "—"}
              editMode={false}
              onChange={() => {}}
              placeholder=""
            />
            <ProfileField
              icon={<Phone size={18} className="text-brand-400" />}
              label="Phone Number"
              value={form.phone}
              editMode={editMode}
              onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
              placeholder="Enter your phone number"
            />
            <ProfileField
              icon={<MapPin size={18} className="text-brand-400" />}
              label="Default Address"
              value={form.address}
              editMode={editMode}
              onChange={(v) => setForm((p) => ({ ...p, address: v }))}
              placeholder="Enter your delivery address"
            />
          </div>

          {saved && (
            <div className="mx-5 mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700 font-semibold flex items-center gap-2">
              <span>✓</span> Profile saved successfully
            </div>
          )}
        </div>

        {/* Quick Nav */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "My Orders", icon: <Package size={18} />, path: "/orders", color: "text-blue-600 bg-blue-50" },
            { label: "Favorites", icon: <Heart size={18} />, path: "/favorites", color: "text-red-500 bg-red-50" },
            { label: "Offers", icon: <Tag size={18} />, path: "/offers", color: "text-brand-500 bg-brand-50" },
          ].map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)} className={"flex items-center gap-3 p-4 rounded-2xl font-semibold text-sm hover:scale-105 transition-transform " + item.color}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileField({ icon, label, value, editMode, onChange, placeholder }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{label}</p>
        {editMode ? (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
          />
        ) : (
          <p className="text-gray-800 font-medium">{value || <span className="text-gray-400">—</span>}</p>
        )}
      </div>
    </div>
  );
}
