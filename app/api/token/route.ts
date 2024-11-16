import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch("https://account.olamaps.io/realms/olamaps/protocol/openid-connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.OLA_CLIENT_ID as string,
        client_secret: process.env.OLA_CLIENT_SECRET as string,
        scope: "openid",
      }),
    });

    if (!response.ok) {
      console.error("Token retrieval failed:", response.statusText);
      return NextResponse.json({ error: "Failed to retrieve token" }, { status: response.status });
    }

    const data = await response.json();
    console.log("Token data:", data); // Log token data for debugging
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in token retrieval:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
