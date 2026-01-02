import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Checks if a user has the ADMIN role in the Firestore users collection.
 * @param {string} uid - The user's ID.
 * @returns {Promise<boolean>} - True if the user is an admin, false otherwise.
 */
export const checkIfAdmin = async (uid) => {
    if (!uid) return false;
    try {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.role === "ADMIN" || userData.role === "SUPERADMIN";
        }
    } catch (error) {
        console.error("Error checking admin status:", error);
    }
    return false;
};
