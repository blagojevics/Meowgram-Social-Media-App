// Migration script to add likes field to existing comments
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

// Your Firebase config - replace with your actual config
const firebaseConfig = {
  // Add your Firebase config here
  // You can find this in your Firebase console > Project settings > General > Your apps
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateComments() {
  try {
    console.log("Starting comment migration...");

    // Get all comments
    const commentsQuery = query(collection(db, "comments"));
    const commentsSnapshot = await getDocs(commentsQuery);

    let updatedCount = 0;
    const batch = [];

    commentsSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();

      // Check if likes field exists
      if (!data.likes) {
        console.log(`Comment ${docSnapshot.id} missing likes field, adding...`);
        batch.push(
          updateDoc(doc(db, "comments", docSnapshot.id), {
            likes: [],
          })
        );
        updatedCount++;
      }
    });

    // Execute all updates
    if (batch.length > 0) {
      await Promise.all(batch);
      console.log(
        `Successfully updated ${updatedCount} comments with likes field`
      );
    } else {
      console.log("All comments already have likes field");
    }

    console.log("Migration completed!");
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

// Run the migration
migrateComments();
