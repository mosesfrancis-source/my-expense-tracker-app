import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../environments/environment';

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(environment.firebase);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
