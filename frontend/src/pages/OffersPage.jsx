import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Tag, Copy, CheckCheck, Zap, Gift, Truck } from "lucide-react";
import NavbarWithCart from "../components/common/NavbarWithCart";
import CartSidebar from "../components/common/CartSidebar";
import { useAuth } from "../hooks/useAuth";

const OFFERS = [
  {
    id: "BURGER40",
    code: "BURGER40",
    title: "Flat 40% OFF",
    description: "Get flat 40% discount on your order from any burger restaurant.",
    gradient: "from-brand-500 to-brand-700",
    icon: <span className="text-4xl">🍔</span>,
    minOrder: "₹399",
    maxDiscount: "Upto ₹120",
    validOn: "Burger restaurants",
    expiry: "31 Dec 2026",
    tag: "POPULAR",
    tagColor: "bg-accent-200 text-brand-800",
  },
  {
    id: "SWEETBOGO",
    code: "SWEETBOGO",
    title: "Buy 1 Get 1 FREE",
    description: "Buy 1 item on selected dessert combo menus and get 1 item completely FREE.",
    gradient: "from-pink-500 to-purple-500",
    icon: <span className="text-4xl">🍰</span>,
    minOrder: "₹299",
    maxDiscount: "Upto ₹120",
    validOn: "Dessert restaurants",
    expiry: "31 Dec 2026",
    tag: "HOT",
    tagColor: "bg-red-500 text-white",
  },
  {
    id: "FREEDEL3",
    code: "FREEDEL3",
    title: "Free Delivery",
    description: "Enjoy FREE delivery on your first 3 orders. No minimum cart value required.",
    gradient: "from-green-500 to-teal-500",
    icon: <span className="text-4xl">🛵</span>,
    minOrder: "₹199",
    maxDiscount: "₹30 off delivery",
    validOn: "All restaurants",
    expiry: "31 Dec 2026",
    tag: "NEW USER",
    tagColor: "bg-blue-500 text-white",
  },
  {
    id: "FLASH25",
    code: "FLASH25",
    title: "Flash Sale – 25% OFF",
    description: "Limited time flash sale! Get 25% off on all pizzas and biryanis.",
    gradient: "from-accent-200 to-brand-500",
    icon: <span className="text-4xl">⚡</span>,
    minOrder: "₹349",
    maxDiscount: "Upto ₹80",
    validOn: "Pizza & Biryani",
    expiry: "30 Apr 2026",
    tag: "LIMITED",
    tagColor: "bg-brand-500 text-white",
  },
  {
    id: "MUNCH50",
    code: "MUNCH50",
    title: "50 OFF on First Order",
    description: "New to Foodyy? Get a flat ₹50 discount on your very first order.",
    gradient: "from-indigo-500 to-blue-500",
    icon: <span className="text-4xl">🎉</span>,
    minOrder: "₹249",
    maxDiscount: "₹50",
    validOn: "All restaurants",
    expiry: "31 Dec 2026",
    tag: "NEW",
    tagColor: "bg-green-500 text-white",
  },
  {
    id: "WEEKEND20",
    code: "WEEKEND20",
    title: "Weekend Special 20% OFF",
    description: "Order over the weekend and get an extra 20% off on all Chinese and South Indian.",
    gradient: "from-cyan-500 to-blue-600",
    icon: <span className="text-4xl">🥡</span>,
    minOrder: "₹299",
    maxDiscount: "Upto ₹60",
    validOn: "Chinese & South Indian",
    expiry: "Every weekend",
    tag: null,
    tagColor: "",
  },
];

export default function OffersPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [copiedCode, setCopiedCode] = useState("");

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/")} className="p-2 rounded-xl hover:bg-gray-200 transition text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Offers & Coupons</h1>
            <p className="text-sm text-gray-500">Save more on every order!</p>
          </div>
        </div>

        {/* Banner */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-700 text-white rounded-3xl p-6 my-6 flex items-center gap-5 shadow-lg">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
            <Gift size={32} />
          </div>
          <div>
            <p className="text-xl font-black">Exclusive Deals Just for You!</p>
            <p className="text-white/80 text-sm mt-1">Apply codes at checkout to save big on your next order.</p>
          </div>
        </div>

        {/* How to use */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Zap size={16} className="text-brand-500" /> How to use a coupon
          </h3>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Add items to your cart and proceed to checkout</li>
            <li>Or apply in the cart sidebar before checkout</li>
            <li>Enter the coupon code in the "Apply Coupon" box</li>
            <li>Discount will be applied automatically</li>
          </ol>
        </div>

        {/* Offer Cards */}
        <div className="space-y-4">
          {OFFERS.map((offer) => (
            <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Top strip */}
              <div className={"bg-gradient-to-r " + offer.gradient + " px-5 py-4 flex items-center gap-4"}>
                {offer.icon}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-white text-lg">{offer.title}</p>
                    {offer.tag && (
                      <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + offer.tagColor}>{offer.tag}</span>
                    )}
                  </div>
                  <p className="text-white/80 text-xs mt-0.5">{offer.description}</p>
                </div>
              </div>

              {/* Details */}
              <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 grid grid-cols-3 gap-3 text-xs text-gray-600">
                  <div>
                    <p className="text-gray-400 font-semibold uppercase tracking-wide">Min Order</p>
                    <p className="font-bold text-gray-800 mt-0.5">{offer.minOrder}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-semibold uppercase tracking-wide">Max Discount</p>
                    <p className="font-bold text-gray-800 mt-0.5">{offer.maxDiscount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-semibold uppercase tracking-wide">Valid On</p>
                    <p className="font-bold text-gray-800 mt-0.5">{offer.validOn}</p>
                  </div>
                </div>
              </div>

              {/* Footer: code + copy */}
              <div className="px-5 pb-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-brand-500" />
                  <span className="font-black text-brand-600 tracking-wider text-sm">{offer.code}</span>
                  <span className="text-xs text-gray-400">| Expires {offer.expiry}</span>
                </div>
                <button
                  onClick={() => copyCode(offer.code)}
                  className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition " + (copiedCode === offer.code ? "bg-green-100 text-green-700" : "bg-brand-50 text-brand-600 hover:bg-accent-200")}
                >
                  {copiedCode === offer.code ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl transition shadow-md">
            <Truck size={18} /> Order Now & Save
          </button>
        </div>
      </div>
    </div>
  );
}
