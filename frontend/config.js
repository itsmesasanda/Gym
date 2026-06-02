import { Platform } from "react-native";

const DEV_HOST = "localhost";
const API_PORT = "5050";

const getApiHost = () => {
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location?.hostname
  ) {
    return window.location.hostname;
  }
  return DEV_HOST;
};

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${getApiHost()}:${API_PORT}`;

export const RAG_URL =
  process.env.EXPO_PUBLIC_RAG_URL || `http://${getApiHost()}:8001`;
