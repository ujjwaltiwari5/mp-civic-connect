import mongoose from "mongoose";
import stringSimilarity from "string-similarity";
import Complaint from "../models/Complaint.js";
export const RADIUS_METERS = 150;
export const TIME_WINDOW_DAYS = 30;
export const CONFIDENCE_THRESHOLD = 0.45;
const TEXT_WEIGHT = 0.6;
const PROXIMITY_WEIGHT = 0.4;
export const findPossibleDuplicates = async ({
  complaintId,
  title,
  description,
  category,
  location,
  createdAt,
}) => {
  const since = new Date(
    (createdAt ? new Date(createdAt) : new Date()).getTime() -
      TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const candidates = await Complaint.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: location.coordinates },
        distanceField: "distanceMeters",
        maxDistance: RADIUS_METERS,
        spherical: true,
        query: {
          category: new mongoose.Types.ObjectId(category),
          status: { $nin: ["resolved", "rejected"] },
          createdAt: { $gte: since },
          ...(complaintId
            ? { _id: { $ne: new mongoose.Types.ObjectId(complaintId) } }
            : {}),
        },
      },
    },
    { $limit: 20 },
  ]);

  const scored = candidates.map((c) => {
    const textScore = stringSimilarity.compareTwoStrings(
      `${title} ${description}`.toLowerCase(),
      `${c.title} ${c.description}`.toLowerCase()
    );
    const proximityScore = 1 - c.distanceMeters / RADIUS_METERS;
    const score = TEXT_WEIGHT * textScore + PROXIMITY_WEIGHT * proximityScore;

    return {
      complaint: c._id,
      score: Number(score.toFixed(3)),
      textScore: Number(textScore.toFixed(3)),
      proximityScore: Number(proximityScore.toFixed(3)),
      distanceMeters: Math.round(c.distanceMeters),
    };
  });

  return scored
    .filter((m) => m.score >= CONFIDENCE_THRESHOLD)
    .sort((a, b) => b.score - a.score);
};