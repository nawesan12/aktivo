import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { searchBusinesses } from "@/lib/directory";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const result = await searchBusinesses({
      q: searchParams.get("q"),
      city: searchParams.get("city"),
      province: searchParams.get("province"),
      category: searchParams.get("category"),
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "directory");
  }
}
