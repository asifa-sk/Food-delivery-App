const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'DRIVER_ASSIGNED', 'PICKED_UP', 'NEARBY', 'DELIVERED'];

const STATUS_LABELS = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  DRIVER_ASSIGNED: 'Driver Assigned',
  ACCEPTED_BY_DRIVER: 'Driver Assigned',
  ARRIVED_AT_RESTAURANT: 'At Restaurant',
  PICKED_UP: 'Picked Up',
  OUT_FOR_DELIVERY: 'On the Way',
  NEARBY: 'Nearby',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_ICONS = {
  PENDING: '1',
  CONFIRMED: '2',
  PREPARING: '3',
  DRIVER_ASSIGNED: '4',
  ACCEPTED_BY_DRIVER: '4',
  ARRIVED_AT_RESTAURANT: '4',
  PICKED_UP: '5',
  OUT_FOR_DELIVERY: '5',
  NEARBY: '6',
  DELIVERED: '7',
  CANCELLED: 'X',
};

function normalizeTrackingStep(status) {
  switch (status) {
    case 'ACCEPTED_BY_DRIVER':
      return 'DRIVER_ASSIGNED';
    case 'ARRIVED_AT_RESTAURANT':
      return 'DRIVER_ASSIGNED';
    case 'OUT_FOR_DELIVERY':
      return 'PICKED_UP';
    default:
      return status;
  }
}

export default function OrderTracking({ order }) {
  const { status, totalPrice, deliveryAddress, orderItems = [] } = order;
  const isCancelled = status === 'CANCELLED';
  const normalizedStatus = normalizeTrackingStep(status);
  const currentStep = isCancelled ? -1 : STATUS_STEPS.indexOf(normalizedStatus);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-800 text-lg">Order #{order.id}</h2>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isCancelled ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-600'}`}>
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      {!isCancelled && (
        <div className="flex items-center gap-1 mb-6">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStep ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i <= currentStep ? 'OK' : STATUS_ICONS[step]}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-1 ${i < currentStep ? 'bg-brand-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500 mb-3">Location: {deliveryAddress}</p>

      <ul className="divide-y divide-gray-100 mb-3">
        {orderItems.map((item, i) => (
          <li key={i} className="flex justify-between py-2 text-sm text-gray-700">
            <span>{item.foodItem?.name || `Item #${item.id}`} x {item.quantity}</span>
            <span>Rs. {(item.unitPrice * item.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="border-t pt-3 flex justify-between font-semibold text-gray-800">
        <span>Total Paid</span>
        <span>Rs. {Number(totalPrice).toFixed(2)}</span>
      </div>
    </div>
  );
}
