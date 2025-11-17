export const baseURL = process.env.NEXT_PUBLIC_LEGACY_API_URL || 'https://zeolive-admin.onrender.com'
export const v2ApiBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://zeolive-backend.onrender.com/v1'
// Backend base URL for uploads (without /v1 suffix)
export const backendBaseURL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'https://zeolive-backend.onrender.com'
export const key = process.env.NEXT_PUBLIC_LEGACY_API_KEY || 'IN.m$B@zgLQ)Ut<pX}PqEFZltD8u^c'

export const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME || 'Zeolive'

export const firebaseConfig = {
  apiKey: "AIzaSyDTG24f8F7xbOT8gMvjaGy6mqMRKKVSYtM",
  authDomain: "zeolive-c2ed8.firebaseapp.com",
  databaseURL: "https://zeolive-c2ed8-default-rtdb.firebaseio.com",
  projectId: "zeolive-c2ed8",
  storageBucket: "zeolive-c2ed8.firebasestorage.app",
  messagingSenderId: "394799862561",
  appId: "1:394799862561:web:9443d3c37780f1332d2460",
  measurementId: "G-GHWLH327TB"
};
