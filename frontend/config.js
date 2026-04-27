import { Platform } from "react-native";

const EXPO_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
const WEB_LOCAL_URL = "http://127.0.0.1:5050";
const DEFAULT_DEVICE_URL = "http://172.28.22.43:5050";

// Web uses 127.0.0.1 so it consistently targets the local backend process.
export const BASE_URL = EXPO_BASE_URL || (Platform.OS === "web" ? WEB_LOCAL_URL : DEFAULT_DEVICE_URL);
