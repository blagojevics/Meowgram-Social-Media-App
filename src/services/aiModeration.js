/**
 * AI-Powered Image Moderation Service (100% Free)
 * Uses TensorFlow.js and NSFW.js for client-side detection
 * NO SERVER COSTS - runs entirely in the browser!
 */

import * as nsfwjs from "nsfwjs";
import * as tf from "@tensorflow/tfjs";

class AIModeration {
  constructor() {
    this.nsfwModel = null;
    this.isLoading = false;
    this.isLoaded = false;
  }

  /**
   * Load the NSFW detection model (only once)
   */
  async loadModel() {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    try {
      this.isLoading = true;
      console.log("🤖 Loading AI moderation model...");

      // Load NSFW.js model (about 4MB download, cached after first load)
      this.nsfwModel = await nsfwjs.load();

      this.isLoaded = true;
      this.isLoading = false;
      console.log("✅ AI moderation model loaded successfully!");
    } catch (error) {
      console.error("❌ Failed to load AI moderation model:", error);
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * Analyze image for NSFW content
   * Returns scores for: Porn, Sexy, Hentai, Neutral, Drawing
   */
  async analyzeImage(imageElement) {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    try {
      const predictions = await this.nsfwModel.classify(imageElement);

      // Convert predictions array to object for easier access
      const scores = {};
      predictions.forEach((prediction) => {
        scores[prediction.className.toLowerCase()] = prediction.probability;
      });

      return scores;
    } catch (error) {
      console.error("Error analyzing image:", error);
      throw error;
    }
  }

  /**
   * Check if image is safe (not NSFW)
   */
  isSafeContent(scores) {
    const pornScore = scores.porn || 0;
    const sexyScore = scores.sexy || 0;
    const hentaiScore = scores.hentai || 0;

    // Strict thresholds for family-friendly content
    const PORN_THRESHOLD = 0.3; // 30% threshold for porn
    const SEXY_THRESHOLD = 0.5; // 50% threshold for sexy content
    const HENTAI_THRESHOLD = 0.3; // 30% threshold for hentai

    if (pornScore > PORN_THRESHOLD) {
      return {
        isSafe: false,
        reason: "🚫 Explicit content detected",
        confidence: pornScore,
      };
    }

    if (sexyScore > SEXY_THRESHOLD) {
      return {
        isSafe: false,
        reason: "🚫 Inappropriate content detected",
        confidence: sexyScore,
      };
    }

    if (hentaiScore > HENTAI_THRESHOLD) {
      return {
        isSafe: false,
        reason: "🚫 Adult content detected",
        confidence: hentaiScore,
      };
    }

    return {
      isSafe: true,
      reason: "✅ Content appears safe",
      confidence: Math.max(scores.neutral || 0, scores.drawing || 0),
    };
  }

  /**
   * Simple animal detection based on common characteristics
   * This is basic - for advanced detection, you'd need specialized models
   */
  detectAnimalCharacteristics(imageElement) {
    // This would require more advanced computer vision models
    // For now, we'll rely on filename and user input
    return {
      hasAnimal: true, // Permissive for now
      confidence: 0.5,
      reason: "Community moderation enabled for animal verification",
    };
  }
}

// Create singleton instance
const aiModerator = new AIModeration();

/**
 * Main function to moderate an image file
 */
export async function moderateImageWithAI(file, description = "") {
  try {
    // Create image element for analysis
    const imageElement = await createImageElement(file);

    // Step 1: Check for NSFW content
    console.log("🔍 Analyzing image for NSFW content...");
    const scores = await aiModerator.analyzeImage(imageElement);
    const safetyCheck = aiModerator.isSafeContent(scores);

    if (!safetyCheck.isSafe) {
      return {
        isAllowed: false,
        reason: safetyCheck.reason,
        confidence: safetyCheck.confidence,
        details: { nsfwScores: scores },
      };
    }

    // Step 2: Basic animal detection (filename + description based)
    const animalCheck = checkForAnimalKeywords(file.name, description);

    // Step 3: Return result
    return {
      isAllowed: true,
      reason: animalCheck.hasAnimal
        ? `🎉 Great! Animal content detected: ${animalCheck.detectedKeywords?.join(
            ", "
          )}`
        : "✅ Content approved! Community can help verify if it's animal-related.",
      confidence: Math.min(safetyCheck.confidence, animalCheck.confidence),
      details: {
        nsfwScores: scores,
        animalDetection: animalCheck,
      },
    };
  } catch (error) {
    console.error("AI moderation error:", error);
    return {
      isAllowed: false,
      reason: "Error analyzing image. Please try again.",
      confidence: 0,
      details: { error: error.message },
    };
  }
}

/**
 * Helper function to create image element from file
 */
function createImageElement(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Enhanced animal keyword detection
 */
function checkForAnimalKeywords(filename, description) {
  const text = `${filename} ${description}`.toLowerCase();

  const animalKeywords = [
    // Pets
    "cat",
    "dog",
    "puppy",
    "kitten",
    "pet",
    "paw",
    "tail",
    "fur",
    "rabbit",
    "bunny",
    "hamster",
    "guinea pig",
    "ferret",
    // Farm animals
    "horse",
    "cow",
    "pig",
    "sheep",
    "goat",
    "chicken",
    "duck",
    "rooster",
    // Wild animals (mouse to giraffe as requested!)
    "mouse",
    "rat",
    "squirrel",
    "chipmunk",
    "elephant",
    "giraffe",
    "lion",
    "tiger",
    "bear",
    "wolf",
    "fox",
    "deer",
    "moose",
    "elk",
    "antelope",
    "zebra",
    "rhino",
    "hippo",
    // Primates
    "monkey",
    "ape",
    "gorilla",
    "chimpanzee",
    "orangutan",
    // Marine life
    "dolphin",
    "whale",
    "shark",
    "fish",
    "octopus",
    "seal",
    "penguin",
    // Birds
    "bird",
    "parrot",
    "eagle",
    "owl",
    "flamingo",
    "peacock",
    "swan",
    // Reptiles & amphibians
    "snake",
    "lizard",
    "turtle",
    "frog",
    "toad",
    "gecko",
    "iguana",
    // General terms
    "animal",
    "wildlife",
    "zoo",
    "safari",
    "nature",
    "mammal",
    "reptile",
  ];

  const detectedKeywords = animalKeywords.filter((keyword) =>
    text.includes(keyword)
  );

  return {
    hasAnimal: detectedKeywords.length > 0,
    detectedKeywords,
    confidence: Math.min(detectedKeywords.length * 0.3, 1.0),
    method: "keyword-based",
  };
}

/**
 * Pre-load the AI model when the app starts (optional)
 */
export async function preloadAIModeration() {
  try {
    await aiModerator.loadModel();
    return true;
  } catch (error) {
    console.warn("Could not preload AI moderation model:", error);
    return false;
  }
}

export default aiModerator;
