import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET(request) {
  // Get the partNumber query parameter
  const { searchParams } = new URL(request.url);
  const partNumber = searchParams.get("partNumber");

  // Connect to MongoDB
  const client = await connect();
  const itemMasterCollection = client.collection("item_master");

  if (!partNumber) {
    return NextResponse.json(
      { error: "partNumber is required" },
      { status: 400 }
    );
  }

  // Perform a case-insensitive search for partNumber
  const results = await itemMasterCollection
    .find({
      part_number: { $regex: partNumber, $options: "i" },
    })
    .toArray();

  // Log the results for debugging
  console.log("Search results:", results);

  // If no results found, return an empty array with a message
  if (!results.length) {
    return NextResponse.json(
      { message: "No items found", data: [] },
      { status: 404 }
    );
  }

  // Map the results to include only relevant fields (e.g., part_number, item_name, quantity)
  const autocompleteData = results.map((item) => ({
    part_number: item.part_number,
    item_name: item.item_name,
    quantity: item.quantity,
  }));

  // Return the filtered data for autocomplete
  return NextResponse.json(autocompleteData);
}
