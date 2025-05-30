import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  try {
    // Get the locator from the request body
    const { locator, warehouse } = await req.json();
    const db = await connect();

    // Check if the locator already exists in the database
    const existingLocator = await db
      .collection("locator_master")
      .findOne({ locator: locator });

    if (existingLocator) {
      // Locator already exists, return an error response
      return NextResponse.json({
        success: false,
        message: "Locator already exists. Please provide a unique locator.",
      });
    } else {
      // Locator is unique, proceed with insertion
      const result = await db
        .collection("locator_master")
        .insertOne({ locator, warehouse });

      return NextResponse.json({
        success: true,
        message: "Locator added successfully.",
        data: result.ops[0],
      });
    }
  } catch (error) {
    // Handle any errors
    return NextResponse.json({
      success: false,
      message: "An error occurred while adding the locator.",
      error: error.message,
    });
  }
}
