export const adminMarkdownContent = `
নিচের প্রম্পটটি (Prompt) কপি করে গুগল এআই স্টুডিওতে নতুন প্রজেক্টে পেস্ট করুন। এটি আপনার নতুন অ্যাপে অ্যাডমিন প্যানেলের ফ্রন্টএন্ড এবং ব্যাকএন্ড (একসাথে) তৈরি করে দিবে:

***

**Copy the prompt below:**

Please build a complete, real-time Admin Panel for my application. Implement both the frontend React component and the backend Node.js API routes based on the following requirements:

### 1. Firebase Setup
Please configure the application to use my existing Firebase project. Create a file at \`src/lib/firebase.ts\` with the following configuration:
\`\`\`typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBtNGvRl53fE0EWjbcyBeSYhSYJEsxLMJg",
  authDomain: "v-e-l-o-r-a.firebaseapp.com",
  databaseURL: "https://v-e-l-o-r-a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "v-e-l-o-r-a",
  storageBucket: "v-e-l-o-r-a.firebasestorage.app",
  messagingSenderId: "315704367890",
  appId: "1:315704367890:web:c72de9be2259f14393b1cb",
  measurementId: "G-8D4YEPV40W"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
\`\`\`
Ensure that the app handles Firebase authentication correctly so that an admin user can log in.

### 2. Frontend (AdminPage.tsx)
- Create a modern, responsive admin dashboard using React, Tailwind CSS, and \`lucide-react\` icons.
- **Top Section**: Display summary cards for "Total Users" and "Active Users". Add a button to "Add New User".
- **User Table**: Display a list of users fetched from the backend. Columns should include: Full Name, Username/ID, Password (hidden by default, with an eye icon to toggle visibility), Role, Status, and Actions.
- **Add User Modal**: A form to create a new user with fields for Full Name, Username, Password, Role (admin/user), and Status (approved/pending/banned). Calls \`POST /api/admin/users\`.
- **Edit User Modal**: A form to update an existing user's details. Calls \`PUT /api/admin/users/:uid\`.
- **Delete Action**: A button to delete a user (with confirmation). Calls \`DELETE /api/admin/users/:uid\`.
- Ensure real-time state updates so the table refreshes when a user is added, edited, or deleted.

### 3. Backend API (server.ts)
Add the following Express routes to manage users in the Firebase Realtime Database. Use the base URL: \`https://v-e-l-o-r-a-default-rtdb.asia-southeast1.firebasedatabase.app\`. Extract the \`Authorization\` header (Bearer token) from requests and append it as \`?auth={token}\` to all Firebase REST API calls.

- \`GET /api/admin/users\`: Fetch all users from \`/user_list.json\` or \`/users.json\`. Parse the object into an array, format the fields (uid, fullName, username, password, role, status), and sort them by \`createdAt\` descending.
- \`POST /api/admin/users\`: Accept \`fullName, username, password, role, status\` from the request body. Generate a unique \`uid\`. Save the user object to \`/users/{uid}.json\` and \`/user_list/{uid}.json\`. Also, save the username mapping in \`/usernames/{username}.json\`.
- \`PUT /api/admin/users/:uid\`: Update the user's details in \`/users/{uid}.json\` and \`/user_list/{uid}.json\`. If the \`username\` was changed, delete the old username mapping from \`/usernames\` and create a new one.
- \`DELETE /api/admin/users/:uid\`: Delete the user from \`/users/{uid}.json\` and \`/user_list/{uid}.json\`. Also, remove their username mapping from \`/usernames/{username}.json\`.

Please provide the complete code for \`AdminPage.tsx\` and the updated \`server.ts\` routes.
`;
