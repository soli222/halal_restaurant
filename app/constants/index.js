export const RATING_OPTIONS = [
  { value: 'recommended', label: '✅ Highly Recommended' },
  { value: 'good', label: '👍 Good' },
  { value: 'average', label: '😐 Average' },
  { value: 'not_recommended', label: '👎 Not Recommended' },
];

export const RATING_STYLES = {
  recommended: {
    pill: 'bg-green-500/15 text-green-400 border border-green-500/25',
    leftBorder: 'border-l-green-500',
    selected: 'bg-green-500 text-white shadow-lg shadow-green-500/20',
    bar: 'bg-green-500',
  },
  good: {
    pill: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    leftBorder: 'border-l-emerald-400',
    selected: 'bg-emerald-400 text-white shadow-lg shadow-emerald-400/20',
    bar: 'bg-emerald-400',
  },
  average: {
    pill: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
    leftBorder: 'border-l-yellow-500',
    selected: 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20',
    bar: 'bg-yellow-500',
  },
  not_recommended: {
    pill: 'bg-red-500/15 text-red-400 border border-red-500/25',
    leftBorder: 'border-l-red-500',
    selected: 'bg-red-500 text-white shadow-lg shadow-red-500/20',
    bar: 'bg-red-500',
  },
};

export const CERTIFYING_BODIES = ['ISNA', 'IFANCA', 'HFA', 'MAS', 'Local Mosque', 'Other'];

export const CUISINES = ['All', 'Pakistani', 'Mediterranean', 'BBQ', 'American Halal', 'Indian', 'Persian', 'Middle Eastern', 'Lebanese', 'Afghan', 'Indonesian', 'Ethiopian', 'Burgers'];

export const CUISINE_IMAGES = {
  'Pakistani':      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop&q=80',
  'Indian':         'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&q=80',
  'Mediterranean':  'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80',
  'BBQ':            'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&h=300&fit=crop&q=80',
  'American Halal': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'Afghan':         'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop&q=80',
  'Persian':        'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&q=80',
  'Middle Eastern': 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop&q=80',
  'Lebanese':       'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400&h=300&fit=crop&q=80',
  'Indonesian':     'https://images.unsplash.com/photo-1555243896-c709bfa0b564?w=400&h=300&fit=crop&q=80',
  'Ethiopian':      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&q=80',
  'Burgers':        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'Turkish':        'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop&q=80',
};

export const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&q=80';

export const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

export const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map(d => [d.key, { open: '11:00', close: '22:00', closed: false }])
);
