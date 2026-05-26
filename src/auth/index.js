// Barrel for the auth folder so callers can do
//   import { auth, db, subscribeToUsers } from '../auth'
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
  // identity helpers
  emailKey,
  userDocRef,
  usersCollectionRef,
  normaliseUserDoc,
  fetchUserProfile,
  createUserProfile,
  ensureUserProfile,
  updateUserProfile,
  touchLastLogin,
  deleteUserProfile,
  subscribeToUsers,
  subscribeToUserDoc,
  mapFirebaseAuthError,
  // roles
  ROLES,
  ROLE_LABEL,
  userHasRole,
  userIsAdmin,
  userIsSeller,
  setUserRole,
  grantRole,
  revokeRole,
  // wishlist
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  // seller counter
  bumpAdsCount,
} from './users'

export {
  chatsCollectionRef,
  chatDocRef,
  chatMessagesCollectionRef,
  makeChatId,
  subscribeToUserChats,
  subscribeToChatMessages,
  ensureChat,
  sendChatMessage,
  markChatRead,
  hideChatForUser,
  deleteChatCompletely,
} from './chats'

export {
  productsCollectionRef,
  productDocRef,
  categoriesCollectionRef,
  categoryDocRef,
  normaliseProductDoc,
  normaliseCategoryDoc,
  subscribeToAllProducts,
  subscribeToSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  subscribeToCategories,
  createCategory,
  deleteCategory,
} from './products'
