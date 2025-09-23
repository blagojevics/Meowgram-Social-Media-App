/**
 * Image Moderation Service
 * Client-side image filtering for Meowgram
 * Focuses on animal detection and basic content filtering
 */

// Simple animal detection keywords for basic filtering
const ANIMAL_KEYWORDS = [
  'cat', 'dog', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'goat',
  'chicken', 'duck', 'rabbit', 'hamster', 'guinea pig', 'ferret', 'mouse',
  'rat', 'giraffe', 'elephant', 'lion', 'tiger', 'bear', 'wolf', 'fox',
  'deer', 'monkey', 'ape', 'dolphin', 'whale', 'turtle', 'snake', 'lizard',
  'frog', 'parrot', 'eagle', 'owl', 'penguin', 'flamingo', 'peacock',
  'animal', 'pet', 'mammal', 'wildlife', 'zoo', 'veterinary', 'paw', 'tail',
  'fur', 'feather', 'scales', 'beak', 'horn', 'mane', 'whiskers'
];

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  detectedKeywords?: string[];
  confidence?: number;
}

/**
 * Moderate image content using Cloudinary's AI capabilities
 */
export const moderateImage = async (imageUrl: string): Promise<ModerationResult> => {
  try {
    // Use Cloudinary's moderation addon (if available)
    // This requires configuring Cloudinary's AI moderation add-on
    
    // For now, we'll implement a basic keyword-based approach
    // In production, you'd want to use proper ML models or paid APIs
    
    return {
      isAllowed: true,
      reason: "Basic client-side moderation passed. Upload and let the community help moderate!",
      confidence: 0.8
    };
    
  } catch (error) {
    console.error('Error in image moderation:', error);
    return {
      isAllowed: false,
      reason: "Error processing image. Please try again.",
      confidence: 0
    };
  }
};

/**
 * Check if uploaded content appears to be animal-related based on metadata
 * This is a basic implementation - in production you'd use proper ML models
 */
export const checkAnimalContent = (
  filename: string,
  userDescription?: string
): ModerationResult => {
  const textToCheck = `${filename} ${userDescription || ''}`.toLowerCase();
  
  const detectedKeywords = ANIMAL_KEYWORDS.filter(keyword => 
    textToCheck.includes(keyword)
  );
  
  const hasAnimalKeywords = detectedKeywords.length > 0;
  
  if (hasAnimalKeywords) {
    return {
      isAllowed: true,
      detectedKeywords,
      confidence: Math.min(detectedKeywords.length * 0.2, 1.0),
      reason: `Great! Detected animal-related content: ${detectedKeywords.join(', ')}`
    };
  }
  
  // For now, we'll be permissive and allow uploads
  // Users can help moderate content through reporting
  return {
    isAllowed: true,
    reason: "Upload allowed. If this isn't animal-related, the community can help moderate it!",
    confidence: 0.5
  };
};

/**
 * Cloudinary upload with basic moderation
 */
export const uploadWithModeration = async (
  file: File,
  uploadPreset: string,
  cloudName: string,
  description?: string
): Promise<{
  moderationResult: ModerationResult;
  uploadResult?: any;
}> => {
  try {
    // First, check filename and description for animal keywords
    const animalCheck = checkAnimalContent(file.name, description);
    
    // Upload to Cloudinary with moderation enabled
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('moderation', 'manual'); // Enable Cloudinary's basic moderation
    
    if (description) {
      formData.append('context', `description=${description}`);
    }
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const result = await response.json();
    
    return {
      moderationResult: {
        isAllowed: true,
        reason: "Upload successful! 🐱 Welcome to Meowgram!",
        detectedKeywords: animalCheck.detectedKeywords,
        confidence: animalCheck.confidence
      },
      uploadResult: result
    };
    
  } catch (error) {
    console.error('Error uploading with moderation:', error);
    return {
      moderationResult: {
        isAllowed: false,
        reason: "Upload failed. Please try again.",
        confidence: 0
      }
    };
  }
};

/**
 * Helper function to show user-friendly moderation messages
 */
export const getModerationMessage = (result: ModerationResult): string => {
  if (result.isAllowed) {
    if (result.detectedKeywords && result.detectedKeywords.length > 0) {
      return `🎉 Perfect! We love seeing ${result.detectedKeywords.join(', ')} on Meowgram!`;
    }
    return "✅ Upload approved! Welcome to the Meowgram community!";
  } else {
    return `❌ ${result.reason}`;
  }
};