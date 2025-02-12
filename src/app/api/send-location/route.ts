import { sendTelegramMessage } from "@/lib/sendTelegramMessage";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ip, city, region, country, location } = body;

    const message = `
New visitor:
IP: ${ip}
Location: ${city}, ${region}, ${country}
Coordinates: ${location}
    `.trim();

    await sendTelegramMessage(message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending location:", error);
    return NextResponse.json(
      { error: "Failed to send location" },
      { status: 500 }
    );
  }
}
