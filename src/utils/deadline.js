export function isRsvpOpen(deadline, now = new Date()) {
  return now <= deadline
}
