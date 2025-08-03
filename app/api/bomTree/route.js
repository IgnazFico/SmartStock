import connect from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const item = searchParams.get("item");
  const db = await connect();

  async function buildBOMTree(parent) {
    const components = await db
      .collection("bom")
      .find({ parent_item_id: parent })
      .toArray();

    return Promise.all(
      components.map(async (c) => ({
        ...c,
        subcomponents: await buildBOMTree(c.component_item_id),
      }))
    );
  }

  const root = {
    component_item_id: item,
    subcomponents: await buildBOMTree(item),
  };

  return NextResponse.json([root]);
}
