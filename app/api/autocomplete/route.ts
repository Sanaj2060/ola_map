import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input");

  try {
    const tokenResponse = await fetch("http://localhost:3001/api/token");
    const tokenData = await tokenResponse.json();
    const access_token = tokenData.access_token;

    if (!access_token) {
      console.error("Error: Missing access token.");
      return NextResponse.json({ error: "Failed to retrieve token" }, { status: 500 });
    }

    const url = `https://api.olamaps.io/places/v1/autocomplete?input=${input}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Autocomplete API Error:", response.statusText, errorText);
      return NextResponse.json({ error: "Autocomplete request failed" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in autocomplete route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
