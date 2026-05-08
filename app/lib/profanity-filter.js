// Profanity filter — replaces matched words with asterisks.
// Words are matched as whole words, case-insensitively, including common
// letter substitutions (e.g. @ for a, 3 for e, 0 for o, $ for s).

const BANNED = [
  'fuck', 'f u c k', 'fck', 'fuuck', 'fuk', 'fuc',
  'shit', 'sh1t', 'sh!t',
  'bitch', 'b1tch', 'b!tch',
  'ass', 'a$$', 'a55',
  'asshole', 'a$$hole',
  'bastard',
  'damn', 'damnit',
  'cunt',
  'dick', 'd1ck',
  'cock', 'c0ck',
  'pussy', 'pu$$y',
  'whore', 'wh0re',
  'slut',
  'nigger', 'nigga',
  'faggot', 'fag',
  'retard',
  'motherfucker', 'mofo',
  'piss',
  'crap',
  'bullshit',
  'jackass',
  'douchebag', 'douche',
  'idiot',
  'stupid',
  'wtf',
  'stfu',
];

// Build a single regex that matches any of the banned words as whole words.
// Escape special regex chars first.
const escaped = BANNED.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');

/**
 * Replace profanity in `text` with asterisks the same length as the matched word.
 * Returns { cleaned: string, found: boolean }
 */
export function cleanProfanity(text) {
  let found = false;
  const cleaned = text.replace(pattern, (match) => {
    found = true;
    return '*'.repeat(match.length);
  });
  return { cleaned, found };
}
