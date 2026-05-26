const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function formatGoogleTime(t) {
  return `${t.slice(0, 2)}:${t.slice(2)}`;
}

function googleHoursToOurFormat(periods) {
  const result = {};
  DAY_KEYS.forEach(key => {
    result[key] = { open: '09:00', close: '21:00', closed: true };
  });
  for (const period of periods) {
    const dayKey = DAY_KEYS[period.open.day];
    result[dayKey] = {
      open: formatGoogleTime(period.open.time),
      close: period.close ? formatGoogleTime(period.close.time) : '23:59',
      closed: false,
    };
  }
  return result;
}

export async function fetchGooglePlacesData(name, address) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  try {
    const query = encodeURIComponent(`${name} ${address}`);
    const findRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${key}`
    );
    const findData = await findRes.json();
    if (findData.status !== 'OK' || !findData.candidates?.length) return null;

    const placeId = findData.candidates[0].place_id;

    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,opening_hours&key=${key}`
    );
    const detailsData = await detailsRes.json();
    if (detailsData.status !== 'OK') return null;

    const place = detailsData.result || {};
    return {
      placeId,
      phone: place.formatted_phone_number || null,
      hours: place.opening_hours?.periods?.length
        ? googleHoursToOurFormat(place.opening_hours.periods)
        : null,
    };
  } catch {
    return null;
  }
}
