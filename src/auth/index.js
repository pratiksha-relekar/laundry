// Barrel for the auth folder so callers can do
//   import { auth, db, storage, googleProvider } from '../auth'
// instead of reaching into individual files.
export {
  app,
  auth,
  db,
  storage,
  googleProvider,
  firebaseConfig,
  getAnalyticsSafe,
} from './firebase'

export {
  userDocRef,
  usersCollectionRef,
  normaliseUserDoc,
  fetchUserProfile,
  createUserProfile,
  updateUserProfile,
  touchLastLogin,
  deleteUserProfile,
  subscribeToUsers,
  mapFirebaseAuthError,
} from './users'
