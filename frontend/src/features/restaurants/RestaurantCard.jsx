export default function RestaurantCard({ restaurant }) {
  const { name, address, phone, active } = restaurant;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100">
      <div className="bg-orange-100 h-36 flex items-center justify-center text-5xl">
        🍽️
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-gray-800 text-lg">{name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
            {active ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-1">{address}</p>
        <p className="text-gray-400 text-xs">{phone}</p>
        <button
          disabled={!active}
          className="mt-4 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-full transition"
        >
          {active ? 'Order Now' : 'Currently Unavailable'}
        </button>
      </div>
    </div>
  );
}
