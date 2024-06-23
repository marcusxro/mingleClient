// Import the functions you need from the SDKs you need
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSexJvogx67ZNp8A82yHmh72R7nXwiX6E",
  authDomain: "social-5f242.firebaseapp.com",
  projectId: "social-5f242",
  storageBucket: "social-5f242.appspot.com",
  messagingSenderId: "93797592449",
  appId: "1:93797592449:web:ff12bc353d76834087cc80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const authentication = getAuth(app)