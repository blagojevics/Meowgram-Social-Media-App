# Meowgram

A full-stack social media single-page application built with React and Firebase. Implements authentication, posting, likes, comments, follows, and live notifications with real-time updates.

---

### Live Demo & Test Account

You can view the live, deployed application here: **[https://meowgram.online](https://meowgram.online)**

To explore the app's full functionality without creating your own account, please feel free to log in with the following credentials:

- **Email:** `meowgramtest@proton.me`
- **Password:** `testtest`

---

**Description**

Meowgram is a responsive social platform where users can register, create posts with images, interact through likes and comments, manage profiles, follow other users, and receive real‑time notifications. Built as a learning project, it has been tested with active users and iterated with real feedback.

<img width="348" height="800" alt="meowgramss2" src="https://github.com/user-attachments/assets/65460bda-c5c5-49a4-b90a-8c9a5eb23b5c" />
<img width="316" height="800" alt="meowgramss3" src="https://github.com/user-attachments/assets/75152447-a204-44f3-b19c-4f9719f7a139" />
<img width="348" height="800" alt="Meowgram ss4" src="https://github.com/user-attachments/assets/f632e276-0031-4e9c-8eb6-a5a6b588e1c8" />

**Features**

Authentication & User Management

- Register new account with email and password

- Email verification required before use

- Login and logout

- Password reset functionality

- User profile management: avatar upload, username, display name, bio, edit profile modal

- Firestore security rules enforce that users can only access their own data

**Posts**

- Create posts with image upload (Cloudinary used as storage)

- Edit post captions

- Delete own posts

- Posts show author avatar, username, timestamp, caption, and image

**Likes**

- Like and unlike posts

- Display like count under posts

- Modal to list users who liked a post (LikesListModal)

**Comments**

- Add comments to posts

- Delete own comment (post owners can also delete)

- Real‑time comment updates (onSnapshot)

- Comment timestamps (2h ago style)

**Follows**

- Follow and unfollow users

- Profile shows followers and following count

- Modal lists for followers and following (FollowListModal)

**Notifications**

- Real‑time notifications for likes, comments, and follows

- Notifications link directly to the associated post

- Preview content in notifications view

**Navigation & Views**

- Home feed showing posts

- User profile page with grid of posts

- Dedicated single post modal/page

- Notifications feed

- Responsive bottom nav for mobile

**UI / UX**

- Mobile‑first responsive design

- Grid profile layout, clean feed presentation

- Placeholder avatars for users without profile picture

- Modals: likes list, follower/following list, single post view, edit profile

- Timestamps for posts and comments

**Technical**

- React with functional components and hooks

- Firebase Authentication

- Firestore database with real‑time listeners (onSnapshot)

- Cloudinary for image storage

- Firebase Hosting for deployment

- Firestore rules securing user data and actions

- GitHub Actions for CI/CD pipeline

**Installation**

1. Clone this repository

2. Install dependencies: "npm install"

3. Create .env file in project root with Firebase and Cloudinary config:

   VITE_FIREBASE_API_KEY=...

   VITE_FIREBASE_AUTH_DOMAIN=...

   VITE_FIREBASE_PROJECT_ID=...

   VITE_FIREBASE_APP_ID=...

   VITE_CLOUDINARY_UPLOAD_URL=...

   VITE_CLOUDINARY_UPLOAD_PRESET=...

4. Run a development server: "npm run dev"

5. Open local host

**Usage**

- Register new user (email verification required)

- Set up profile with avatar, username, bio

- Create, edit, or delete posts with images uploaded to Cloudinary

- Like and comment on posts

- Follow or unfollow other users

- View notifications as actions happen in real‑time

**Deployment**

- Deployed to Firebase Hosting (meowgram.online(soon))

- Continuous deployment via GitHub Actions

**Current State**

- Tested with several real users (posts, likes, comments, follows, notifications)

- Functional and iterated with feedback

**Future Plans**

- Google Vision API integration for photo moderation (NSFW filter, animal detection)

- “Following feed” for posts only from followed users

- Desktop redesign with improved styling

- Dark mode support

<img width="1522" height="952" alt="Meowgram ss1" src="https://github.com/user-attachments/assets/c06aafeb-15d1-4b94-a874-50831cf38ee7" />
