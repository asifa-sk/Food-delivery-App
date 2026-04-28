import { calculateDeliveryCharge as calculateTrackingCharge, sanitizeDeliveryCharge, sanitizeDeliveryDistanceKm } from './deliveryTracking';

export function normalizeOrder(order) {
  if (!order) return order;

  const orderItems = Array.isArray(order.orderItems)
    ? order.orderItems
    : Array.isArray(order.items)
      ? order.items
      : [];

  const items = orderItems.map((item) => {
    const foodItem = item.foodItem || item.food || {};
    const quantity = Number(item.quantity ?? item.qty ?? 1);
    const unitPrice = Number(item.unitPrice ?? item.price ?? foodItem.price ?? 0);
    const totalPrice = Number(item.totalPrice ?? item.lineTotal ?? (unitPrice * quantity));

    return {
      id: item.id || item.orderItemId || foodItem.id,
      foodItemId: item.foodItemId || foodItem.id,
      name: foodItem.name || item.name || item.title || 'Item',
      quantity,
      unitPrice,
      totalPrice,
      foodItem,
      raw: item,
    };
  });

  const rawTotal = order.totalPrice
    ?? order.totalAmount
    ?? order.amount
    ?? order.price
    ?? items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalPrice = Number(rawTotal ?? 0);

  const createdAt = order.createdAt || order.orderDate || order.created_on || null;
  const deliveredAt = order.deliveredAt || order.delivered_on || null;
  const restaurantName = order.restaurant?.name || order.restaurantName || 'Restaurant';
  const customerName = order.customer?.name || order.customerName || 'Customer';
  const status = order.status || order.orderStatus || 'PENDING';
  const driverLastLatitude = order.driverLastLatitude ?? order.driver_last_latitude ?? null;
  const driverLastLongitude = order.driverLastLongitude ?? order.driver_last_longitude ?? null;
  const driverLocationUpdatedAt = order.driverLocationUpdatedAt ?? order.driver_location_updated_at ?? null;
  const customerLatitude = sanitizeCoordinateValue(order.customerLatitude ?? order.customer_latitude ?? null);
  const customerLongitude = sanitizeCoordinateValue(order.customerLongitude ?? order.customer_longitude ?? null);
  const restaurantLatitude = sanitizeCoordinateValue(
    order.restaurant?.latitude ?? order.restaurantLatitude ?? order.restaurant_latitude ?? null
  );
  const restaurantLongitude = sanitizeCoordinateValue(
    order.restaurant?.longitude ?? order.restaurantLongitude ?? order.restaurant_longitude ?? null
  );
  const deliveryDistanceKm = order.deliveryDistanceKm ?? order.delivery_distance_km ?? null;
  const deliveryCharge = order.deliveryCharge ?? order.delivery_charge ?? null;
  const estimatedDeliveryMinutes = order.estimatedDeliveryMinutes ?? order.estimated_delivery_minutes ?? null;
  const normalizedDistanceKm = sanitizeDeliveryDistanceKm(deliveryDistanceKm);
  const normalizedDeliveryCharge = sanitizeDeliveryCharge(deliveryCharge, normalizedDistanceKm);

  const orderId = order.id || order.orderId;

  return {
    id: orderId,
    orderId: order.orderId || order.id,
    displayId: createDisplayOrderId(orderId),
    status,
    statusLabel: getOrderStatusLabel(status),
    totalPrice,
    createdAt,
    deliveredAt,
    deliveryAddress: order.deliveryAddress || order.customerAddress || 'Home',
    customer: order.customer || null,
    customerName,
    customerPhone: order.customerPhone || order.customer?.phoneNumber || order.customer?.phone || '',
    restaurant: order.restaurant || { name: restaurantName },
    restaurantName,
    items,
    orderItems: items,
    driver: order.driver || null,
    customerLatitude: customerLatitude == null ? null : Number(customerLatitude),
    customerLongitude: customerLongitude == null ? null : Number(customerLongitude),
    restaurantLatitude: restaurantLatitude == null ? null : Number(restaurantLatitude),
    restaurantLongitude: restaurantLongitude == null ? null : Number(restaurantLongitude),
    deliveryDistanceKm: normalizedDistanceKm,
    deliveryCharge: normalizedDeliveryCharge,
    estimatedDeliveryMinutes: estimatedDeliveryMinutes == null ? null : Number(estimatedDeliveryMinutes),
    driverLastLatitude: driverLastLatitude == null ? null : Number(driverLastLatitude),
    driverLastLongitude: driverLastLongitude == null ? null : Number(driverLastLongitude),
    driverLocationUpdatedAt,
    accepted: !!order.driver || ['ACCEPTED_BY_DRIVER', 'DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'NEARBY', 'DELIVERED'].includes(status),
    raw: order,
  };
}

export function sortOrdersByNewest(orders = [], primaryDateField = 'createdAt') {
  return [...orders].sort((a, b) => {
    const aTime = getSortableOrderTime(a, primaryDateField);
    const bTime = getSortableOrderTime(b, primaryDateField);
    if (aTime !== bTime) return bTime - aTime;
    return Number(b?.id ?? 0) - Number(a?.id ?? 0);
  });
}

export function getOrderStatusLabel(status) {
  switch (status) {
    case 'ACCEPTED_BY_DRIVER':
    case 'DRIVER_ASSIGNED':
      return 'Driver Assigned';
    case 'ARRIVED_AT_RESTAURANT':
      return 'Arrived at Restaurant';
    case 'PICKED_UP':
      return 'Picked Up';
    case 'NEARBY':
      return 'Nearby';
    case 'OUT_FOR_DELIVERY':
      return 'On the Way';
    default:
      return String(status || 'PENDING')
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
  }
}

export function formatOrderCurrency(amount) {
  return `₹${Number(amount ?? 0).toFixed(2)}`;
}

export function formatOrderDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function calculateDeliveryCharge(distanceKm) {
  return calculateTrackingCharge(distanceKm);
}

function createDisplayOrderId(orderId) {
  const numericId = Number(orderId ?? 0);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return 'NA';
  }
  return String(Math.trunc(numericId));
}

function getSortableOrderTime(order, primaryDateField) {
  const primary = order?.[primaryDateField];
  const created = order?.createdAt;
  const primaryTime = primary ? new Date(primary).getTime() : 0;
  if (Number.isFinite(primaryTime) && primaryTime > 0) return primaryTime;
  const createdTime = created ? new Date(created).getTime() : 0;
  return Number.isFinite(createdTime) ? createdTime : 0;
}

function sanitizeCoordinateValue(value) {
  if (value == null || value === '') return null;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return null;
  }
  return numericValue;
}
