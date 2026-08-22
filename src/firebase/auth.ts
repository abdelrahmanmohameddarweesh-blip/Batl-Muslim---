import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppUser = {
  uid: string;
  displayName: string;
  score: number;
  lastPlayedAt?: string;
  country?: string;
  countryCode?: string;
  phone?: string;
  age?: number;
  photoUri?: string;
  championshipScore?: number;
  championshipTime?: number;
};

export const auth = null;

const PLAYERS_KEY = 'batl-muslim-players-v1';
const CURRENT_USER_KEY = 'batl-muslim-current-user-v1';

function normalizeDisplayName(displayName: string) {
  const trimmed = (displayName || '').trim();
  return trimmed || 'ضيف';
}

function createPlayerId(displayName: string) {
  const safeName = normalizeDisplayName(displayName).replace(/\s+/g, '-').toLowerCase();
  return `guest-${safeName}-${Date.now().toString(36)}`;
}

async function readPlayers(): Promise<Record<string, AppUser>> {
  try {
    const raw = await AsyncStorage.getItem(PLAYERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writePlayers(players: Record<string, AppUser>) {
  await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

async function readCurrentUser(): Promise<AppUser | null> {
  try {
    const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function signInAnonymous(displayName: string, phone: string, country: string, age?: number, photoUri?: string): Promise<AppUser> {
  const name = normalizeDisplayName(displayName);
  const existingUser = await readCurrentUser();
  const players = await readPlayers();
  const uid = existingUser?.displayName === name ? existingUser.uid : createPlayerId(name);

  const user: AppUser = {
    uid,
    displayName: name,
    score: players[uid]?.score ?? existingUser?.score ?? 0,
    lastPlayedAt: players[uid]?.lastPlayedAt ?? existingUser?.lastPlayedAt,
    phone: phone.trim() || undefined,
    country: country.trim() || undefined,
    age: age || undefined,
    photoUri: photoUri || undefined,
  };

  players[uid] = user;
  await writePlayers(players);
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export function onAuthStateChangedListener(callback: (user: AppUser | null) => void) {
  callback(null);
  return () => {};
}

export async function signOutUser() {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
}

export async function saveUserScore(uid: string, score: number) {
  if (!uid) {
    return;
  }

  const players = await readPlayers();
  const existing = players[uid];
  const nextUser: AppUser = {
    uid,
    displayName: existing?.displayName || 'ضيف',
    score,
    lastPlayedAt: new Date().toISOString(),
  };

  players[uid] = nextUser;
  await writePlayers(players);
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(nextUser));
}

export async function getTopPlayers() {
  const players = Object.values(await readPlayers());
  return players.sort((a, b) => b.score - a.score).slice(0, 10);
}

export async function getAllPlayers() {
  const players = Object.values(await readPlayers());
  return players.sort((a, b) => b.score - a.score);
}

export async function getCurrentUserProfile(uid: string) {
  const players = await readPlayers();
  return players[uid] ?? null;
}

export async function updateUserCountry(uid: string, country: string, countryCode: string) {
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) return;
  const updatedUser: AppUser = {
    ...existing,
    country,
    countryCode,
  };
  players[uid] = updatedUser;
  await writePlayers(players);
  
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  }
}

export async function saveUserChampionshipResult(uid: string, score: number, seconds: number) {
  if (!uid) return;
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) return;
  
  const updatedUser: AppUser = {
    ...existing,
    championshipScore: score,
    championshipTime: seconds,
    score: existing.score + score,
    lastPlayedAt: new Date().toISOString(),
  };

  players[uid] = updatedUser;
  await writePlayers(players);
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
}

export async function updateUserPhoto(uid: string, photoUri: string) {
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) return;
  const updatedUser: AppUser = {
    ...existing,
    photoUri,
  };
  players[uid] = updatedUser;
  await writePlayers(players);
  
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  }
}

export async function updateUserAge(uid: string, age: number) {
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) return;
  const updatedUser: AppUser = {
    ...existing,
    age,
  };
  players[uid] = updatedUser;
  await writePlayers(players);
  
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  }
}

