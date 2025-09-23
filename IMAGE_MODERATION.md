# 🐱 Meowgram Image Moderation

## Overview

Basic client-side image moderation system that encourages animal-focused content on Meowgram.

## Features

### ✅ What We Implemented:

- **Animal Content Detection**: Keyword-based detection for animal-related content
- **User-Friendly Messages**: Encouraging messages when animal content is detected
- **Upload Integration**: Seamless integration with Cloudinary uploads
- **Community Moderation**: Encourages community reporting for inappropriate content

### 🔍 How It Works:

1. **Filename Analysis**: Checks uploaded filenames for animal-related keywords
2. **Caption Analysis**: Analyzes user captions for animal content
3. **Positive Reinforcement**: Shows encouraging messages for animal content
4. **Fallback Approach**: Allows uploads even without detected animals (community can moderate)

### 🐾 Animal Keywords Detected:

- **Pets**: cat, dog, bird, fish, rabbit, hamster, guinea pig, ferret
- **Farm Animals**: horse, cow, pig, sheep, goat, chicken, duck
- **Wildlife**: giraffe, elephant, lion, tiger, bear, wolf, fox, deer
- **Aquatic**: dolphin, whale, shark, turtle
- **Reptiles**: snake, lizard, frog, toad
- **Birds**: parrot, eagle, owl, penguin, flamingo, peacock
- **General Terms**: animal, pet, mammal, wildlife, zoo, paw, tail, fur, feather

### 🚀 Future Enhancements:

- **Google Vision API**: Full ML-based animal detection (requires Firebase Functions)
- **NSFW Detection**: Automated content filtering
- **Community Reporting**: User-driven moderation system
- **Admin Dashboard**: Content review tools for moderators

## Implementation Details

### Files:

- `src/services/imageModeration.ts` - Core moderation logic
- `src/pages/addpost/AddPost.jsx` - Integration with upload flow
- `src/pages/addpost/addpost.scss` - UI styling for moderation messages

### Usage:

```javascript
import {
  uploadWithModeration,
  getModerationMessage,
} from "../../services/imageModeration";

const { moderationResult, uploadResult } = await uploadWithModeration(
  imageFile,
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_CLOUD_NAME,
  caption
);
```

## Why This Approach?

1. **No Additional Costs**: Works with existing Firebase Spark plan
2. **User Education**: Encourages users to upload animal content
3. **Community-Driven**: Relies on user community for content quality
4. **Scalable**: Can be enhanced with proper ML services later

## Next Steps

To implement full Google Vision API moderation:

1. Upgrade Firebase to Blaze plan
2. Deploy Firebase Functions with Vision API integration
3. Add server-side NSFW detection
4. Implement automated content rejection

---

_Made with 🐱 for the Meowgram community!_
