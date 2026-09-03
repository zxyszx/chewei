type SeatMetricSlot = {
  status: string;
  capacity: number;
  members: Array<{ status: string }>;
};

export function seatMetrics<T extends SeatMetricSlot>(slots: T[]) {
  const activeSlots = slots.filter((slot) => slot.status === "ACTIVE");
  const capacity = activeSlots.reduce((sum, slot) => sum + slot.capacity, 0);
  const occupied = activeSlots.reduce((sum, slot) => sum + slot.members.filter((member) => member.status === "ACTIVE").length, 0);
  return {
    activeSlots,
    capacity,
    occupied,
    remaining: Math.max(0, capacity - occupied),
    utilization: capacity ? Math.round((occupied / capacity) * 1000) / 10 : 0,
  };
}
