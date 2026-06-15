import AsyncStorage from "@react-native-async-storage/async-storage";
import { setSentryUser } from "./report";

// Source of truth — kept in memory, persisted to AsyncStorage on the side.
let currentUserEmail = null;
let currentUserToken = null;
let currentUserName  = null;
let currentUserGym   = null; // { id, name, code, branding } — the member's gym

/**
 * Read the persisted email from AsyncStorage into memory.
 * Call this ONCE at app startup (App.js) before rendering screens.
 * After this resolves, getUserEmail() returns the saved value synchronously.
 */
export const hydrateSession = async () => {
  try {
    const stored = await AsyncStorage.getItem("userEmail");
    if (stored) { currentUserEmail = stored; setSentryUser(stored); }

    const token = await AsyncStorage.getItem("userToken");
    if (token) currentUserToken = token;

    const name = await AsyncStorage.getItem("userName");
    if (name) currentUserName = name;

    const gym = await AsyncStorage.getItem("userGym");
    if (gym) currentUserGym = JSON.parse(gym);
  } catch (e) {
    console.error("hydrateSession:", e);
  }
};

export const setUserEmail = (email) => {
  currentUserEmail = email;
  setSentryUser(email); // tag Sentry events with this user
  // Fire-and-forget persistence — UI doesn't wait
  if (email) {
    AsyncStorage.setItem("userEmail", email).catch((e) =>
      console.error("setUserEmail persist:", e)
    );
  } else {
    AsyncStorage.removeItem("userEmail").catch((e) =>
      console.error("setUserEmail remove:", e)
    );
  }
};

export const getUserEmail = () => {
  return currentUserEmail;
};

export const setUserToken = (token) => {
  currentUserToken = token;
  if (token) {
    AsyncStorage.setItem("userToken", token).catch((e) =>
      console.error("setUserToken persist:", e)
    );
  } else {
    AsyncStorage.removeItem("userToken").catch((e) =>
      console.error("setUserToken remove:", e)
    );
  }
};

export const getUserToken = () => {
  return currentUserToken;
};

export const setUserName = (name) => {
  currentUserName = name;
  if (name) {
    AsyncStorage.setItem("userName", name).catch((e) =>
      console.error("setUserName persist:", e)
    );
  } else {
    AsyncStorage.removeItem("userName").catch((e) =>
      console.error("setUserName remove:", e)
    );
  }
};

export const getUserName = () => currentUserName;

export const setUserGym = (gym) => {
  currentUserGym = gym || null;
  if (gym) {
    AsyncStorage.setItem("userGym", JSON.stringify(gym)).catch((e) =>
      console.error("setUserGym persist:", e)
    );
  } else {
    AsyncStorage.removeItem("userGym").catch((e) =>
      console.error("setUserGym remove:", e)
    );
  }
};

export const getUserGym = () => currentUserGym;

export const clearUserEmail = () => {
  currentUserEmail = null;
  currentUserToken = null;
  currentUserName  = null;
  currentUserGym   = null;
  setSentryUser(null); // stop attributing events to the logged-out user
  AsyncStorage.removeItem("userEmail").catch((e) =>
    console.error("clearUserEmail:", e)
  );
  AsyncStorage.removeItem("userToken").catch((e) =>
    console.error("clearUserEmail token:", e)
  );
  AsyncStorage.removeItem("userName").catch((e) =>
    console.error("clearUserName:", e)
  );
  AsyncStorage.removeItem("userGym").catch((e) =>
    console.error("clearUserGym:", e)
  );
};
