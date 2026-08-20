export function firstAvailableSeat(capacity: number, occupiedSeats: Iterable<number | null | undefined>) {
  const occupied = new Set(Array.from(occupiedSeats).filter((value): value is number => typeof value === "number" && Number.isInteger(value) && value > 0));
  for (let seatNumber = 1; seatNumber <= capacity; seatNumber += 1) {
    if (!occupied.has(seatNumber)) return seatNumber;
  }
  return null;
}
