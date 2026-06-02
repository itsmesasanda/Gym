import AsyncStorage from "@react-native-async-storage/async-storage";

// Source of truth — kept in memory, persisted to AsyncStorage on the side.
let currentUserEmail = null;
let currentUserToken = null;
let currentUserName  = null;

/**
 * Read the persisted email from AsyncStorage into memory.
 * Call this ONCE at app startup (App.js) before rendering screens.
 * After this resolves, getUserEmail() returns the saved value synchronously.
 */
export const hydrateSession = async () => {
  try {
    const stored = await AsyncStorage.getItem("userEmail");
    if (stored) currentUserEmail = stored;

    const token = await AsyncStorage.getItem("userToken");
    if (token) currentUserToken = token;

    const name = await AsyncStorage.getItem("userName");
    if (name) currentUserName = name;
  } catch (e) {
    console.error("hydrateSession:", e);
  }
};

export const setUserEmail = (email) => {
  currentUserEmail = email;
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

export const clearUserEmail = () => {
  currentUserEmail = null;
  currentUserToken = null;
  currentUserName  = null;
  AsyncStorage.removeItem("userEmail").catch((e) =>
    console.error("clearUserEmail:", e)
  );
  AsyncStorage.removeItem("userToken").catch((e) =>
    console.error("clearUserEmail token:", e)
  );
  AsyncStorage.removeItem("userName").catch((e) =>
    console.error("clearUserName:", e)
  );
};
