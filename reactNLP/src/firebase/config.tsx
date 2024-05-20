import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9CZF8y1UT0Q5AgxWOffTK_PcoL0I3KUM",
  authDomain: "nlpweb-1ea06.firebaseapp.com",
  projectId: "nlpweb-1ea06",
  storageBucket: "nlpweb-1ea06.appspot.com",
  messagingSenderId: "507738109880",
  appId: "1:507738109880:web:955c7bdbef32003bf3c14d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);