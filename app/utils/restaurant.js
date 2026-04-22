export function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}

export function getOpenStatus(hours) {
  if (!hours) return null;
  const now = new Date();
  const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
  const today = hours[dayKey];
  if (!today || today.closed) return { status: 'closed', label: 'Closed today' };
  const [openH, openM] = today.open.split(':').map(Number);
  const [closeH, closeM] = today.close.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  if (nowMins < openMins) return { status: 'closed', label: `Opens at ${formatTime(today.open)}` };
  if (nowMins >= closeMins) return { status: 'closed', label: `Closed · opens tomorrow` };
  const minsLeft = closeMins - nowMins;
  if (minsLeft <= 60) return { status: 'closing', label: `Closes in ${minsLeft}m` };
  return { status: 'open', label: `Open · closes ${formatTime(today.close)}` };
}

export function certExpiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.floor((expiry - now) / 86400000);
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring';
  return 'valid';
}

export function getAvatarStyle(letter) {
  const styles = [
    'bg-green-500/20 text-green-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-teal-500/20 text-teal-400',
    'bg-green-600/20 text-green-500',
    'bg-emerald-400/20 text-emerald-300',
  ];
  return styles[(letter?.charCodeAt(0) || 0) % styles.length];
}
