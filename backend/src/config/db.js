import mongoose from "mongoose";

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn("MONGODB_URI is missing. Starting without database persistence.");
    return false;
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    console.warn(`MongoDB unavailable. Starting with in-memory fallback: ${error.message}`);
    return false;
  }
};

export default connectDatabase;
