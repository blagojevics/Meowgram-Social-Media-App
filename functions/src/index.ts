/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";

// Google Vision API
import { ImageAnnotatorClient } from "@google-cloud/vision";

// Initialize Firebase Admin
initializeApp();

const vision = new ImageAnnotatorClient();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  detectedAnimals?: string[];
  safeSearchScores?: any;
}

/**
 * Moderate image content using Google Vision API
 * Rejects NSFW content and only allows animal photos
 */
export const moderateImage = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (request.method !== "POST") {
        response.status(405).send("Method not allowed");
        return;
      }

      const { imageUrl, userId } = request.body;

      if (!imageUrl) {
        response.status(400).send("Missing imageUrl");
        return;
      }

      logger.info(`Moderating image: ${imageUrl} for user: ${userId}`);

      // Download image from URL for analysis
      const [result] = await vision.safeSearchDetection({
        image: { source: { imageUri: imageUrl } },
      });

      const safeSearch = result.safeSearchAnnotation;

      // Check for NSFW content
      const isNSFW =
        safeSearch?.adult === "LIKELY" ||
        safeSearch?.adult === "VERY_LIKELY" ||
        safeSearch?.violence === "LIKELY" ||
        safeSearch?.violence === "VERY_LIKELY";

      if (isNSFW) {
        const moderationResult: ModerationResult = {
          isAllowed: false,
          reason: "Content flagged as inappropriate (NSFW/violent content)",
          safeSearchScores: safeSearch,
        };

        logger.warn(`NSFW content detected for user ${userId}:`, safeSearch);
        response.json(moderationResult);
        return;
      }

      // Check for animals using label detection
      const [labelResult] = await vision.labelDetection({
        image: { source: { imageUri: imageUrl } },
      });

      const labels = labelResult.labelAnnotations || [];

      // Animal-related labels to look for
      const animalKeywords = [
        "animal",
        "mammal",
        "cat",
        "dog",
        "bird",
        "fish",
        "reptile",
        "amphibian",
        "pet",
        "wildlife",
        "zoo",
        "domestic animal",
        "carnivore",
        "herbivore",
        "vertebrate",
        "invertebrate",
        "feline",
        "canine",
        "equine",
        "bovine",
        "porcine",
        // Specific animals from mouse to giraffe!
        "mouse",
        "rat",
        "hamster",
        "guinea pig",
        "rabbit",
        "ferret",
        "horse",
        "cow",
        "pig",
        "sheep",
        "goat",
        "chicken",
        "duck",
        "giraffe",
        "elephant",
        "lion",
        "tiger",
        "bear",
        "wolf",
        "fox",
        "deer",
        "monkey",
        "ape",
        "gorilla",
        "chimpanzee",
        "dolphin",
        "whale",
        "shark",
        "turtle",
        "snake",
        "lizard",
        "frog",
        "toad",
        "salamander",
        "parrot",
        "eagle",
        "owl",
        "penguin",
        "flamingo",
        "peacock",
        "swan",
        "crane",
      ];

      const detectedAnimals: string[] = [];
      let hasAnimal = false;

      for (const label of labels) {
        const description = label.description?.toLowerCase() || "";
        const score = label.score || 0;

        // Only consider labels with decent confidence (>0.5)
        if (score > 0.5) {
          for (const keyword of animalKeywords) {
            if (description.includes(keyword)) {
              hasAnimal = true;
              detectedAnimals.push(description);
              break;
            }
          }
        }
      }

      logger.info(
        `Labels detected:`,
        labels.map((l) => `${l.description}: ${l.score}`)
      );
      logger.info(`Animals detected:`, detectedAnimals);

      if (!hasAnimal) {
        const moderationResult: ModerationResult = {
          isAllowed: false,
          reason:
            "Only animal photos are allowed on Meowgram! 🐱 From mice to giraffes, we love all creatures!",
          detectedAnimals: [],
        };

        logger.info(`No animals detected for user ${userId}`);
        response.json(moderationResult);
        return;
      }

      // Image passed all checks!
      const moderationResult: ModerationResult = {
        isAllowed: true,
        detectedAnimals,
        safeSearchScores: safeSearch,
      };

      logger.info(
        `Image approved for user ${userId}. Animals: ${detectedAnimals.join(
          ", "
        )}`
      );
      response.json(moderationResult);
    } catch (error) {
      logger.error("Error moderating image:", error);
      response.status(500).json({
        isAllowed: false,
        reason: "Error processing image. Please try again.",
      });
    }
  }
);

/**
 * Test function to check if everything is working
 */
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send(
    "Hello from Meowgram Functions! 🐱🦒 Ready to moderate animal photos!"
  );
});
