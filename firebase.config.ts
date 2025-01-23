import {initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";
import {getAuth, getReactNativePersistence} from 'firebase/auth';
import {getStorage} from "firebase/storage";
import {getDatabase} from "firebase/database";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
    apiKey: "AIzaSyBj1gN-jMlUV5a9E2x_Gmye0YNUGWIOI94",
    authDomain: "parking-buddy-c74f7.firebaseapp.com",
    projectId: "parking-buddy-c74f7",
    storageBucket: "parking-buddy-c74f7.firebasestorage.app",
    messagingSenderId: "729192685594",
    appId: "1:729192685594:web:d140a2aea49ffb12fd71a3",
    measurementId: "G-5DY3C78KNP"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
auth.useDeviceLanguage();
auth.setPersistence(getReactNativePersistence(ReactNativeAsyncStorage))
    .then(r => console.log(r));


const analytics = getAnalytics(app);

const storage = getStorage(app);
const database = getDatabase(app);

export {app, auth, analytics, storage, database};