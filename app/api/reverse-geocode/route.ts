// app/api/reverse-geocode/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await response.json();

    return NextResponse.json({ place_name: data.display_name });
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return NextResponse.json({ error: "Failed to reverse geocode" }, { status: 500 });
  }
}
