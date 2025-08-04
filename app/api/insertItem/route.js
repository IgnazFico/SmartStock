import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  try {
    // Get the item details from the request body
    const { item_id, toy_number, description } = await req.json();
    const db = await connect();

    // Check if the item_id already exists in the database
    const existingItem = await db
      .collection("item_master")
      .findOne({ item_id: item_id });

    if (existingItem) {
      // item_id already exists, return an error response
      return NextResponse.json({
        success: false,
        message:
          "Part number already exists. Please provide a unique part number.",
      });
    } else {
      // item_id is unique, proceed with insertion
      const newItem = {
        item_id,
        toy_number,
        description,
      };
      const result = await db.collection("item_master").insertOne(newItem);

      return NextResponse.json({
        success: true,
        message: "Item added successfully.",
        data: result.ops[0],
      });
    }
  } catch (error) {
    // Handle any errors
    return NextResponse.json({
      success: false,
      message: "An error occurred while adding the item.",
      error: error.message,
    });
  }
}
