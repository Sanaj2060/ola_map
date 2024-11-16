import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  try {
    const tokenResponse = await fetch("http://localhost:3001/api/token");
    if (!tokenResponse.ok) {
      console.error("Error retrieving token:", tokenResponse.statusText);
      return NextResponse.json({ error: "Failed to retrieve token" }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const access_token = tokenData.access_token;

    if (!access_token) {
      console.error("Error: Missing access token.");
      return NextResponse.json({ error: "Failed to retrieve token" }, { status: 500 });
    }

    const url = `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${origin}&destinations=${destination}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Distance Matrix API Error:", response.statusText, errorText);
      return NextResponse.json({ error: "Distance Matrix request failed" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in distance-matrix route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
