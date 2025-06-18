#!/usr/bin/env node
/**
 * Initialize the first admin user in the application
 * 
 * Usage:
 *   npm run init-admin -- --email admin@example.com --password securePassword --name "Admin User"
 */

import { userService } from "~/services/user.service.server";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Parse command-line arguments
const args = process.argv.slice(2);
const params: Record<string, string> = {};

// Simple argument parser
for (let i = 0; i < args.length; i += 2) {
  if (args[i].startsWith("--")) {
    params[args[i].slice(2)] = args[i + 1];
  }
}

// Validate required parameters
const requiredParams = ["email", "password", "name"];
const missingParams = requiredParams.filter(param => !params[param]);

if (missingParams.length > 0) {
  console.error(`Error: Missing required parameters: ${missingParams.join(", ")}`);
  console.log("\nUsage:");
  console.log("  npm run init-admin -- --email admin@example.com --password securePassword --name \"Admin User\"");
  process.exit(1);
}

// Connect to the database
async function run() {
  try {
    const MONGODB_URI = process.env.DB_URL;
    
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in the environment variables");
    }
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if user already exists
    const existingUser = await userService.findByEmail(params.email);
    
    if (existingUser) {
      console.log(`User with email ${params.email} already exists.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Split the name into first and last name
    const nameParts = params.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Create the user with pharmacy-owner role by default
    const user = await userService.create({
      email: params.email,
      password: params.password,
      firstName,
      lastName,
      role: params.role || "pharmacy-owner", // This is equivalent to admin role
    });

    console.log(`Administrator created successfully:`);
    console.log(`- ID: ${user._id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Name: ${user.firstName} ${user.lastName}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- PIN: Please note this PIN as it will only be displayed once!`);
    console.log(`  PIN: ${params.password.substring(0, 4)}`); // Show the original PIN before hashing

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

run();
