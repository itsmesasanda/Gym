import AsyncStorage from "@react-native-async-storage/async-storage";

// Source of truth — kept in memory, persisted to AsyncStorage on the side.
let currentUserEmail = null;

/**
 * Read the persisted email from AsyncStorage into memory.
 * Call this ONCE at app startup (App.js) before rendering screens.
 * After this resolves, getUserEmail() returns the saved value synchronously.
 */
export const hydrateSession = async () => {
  try {
    const stored = await AsyncStorage.getItem("userEmail");
    if (stored) currentUserEmail = stored;
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

export const clearUserEmail = () => {
  currentUserEmail = null;
  AsyncStorage.removeItem("userEmail").catch((e) =>
    console.error("clearUserEmail:", e)
  );
};
