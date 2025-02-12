import { sendTelegramMessage } from "@/lib/sendTelegramMessage";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ip,
      city,
      region,
      country,
      location,
      userAgent,
      platform,
      language,
      vendor,
      screenResolution,
      windowSize,
    } = body;

    const message = `
New visitor:
IP: ${ip}
Location: ${city}, ${region}, ${country}
Coordinates: ${location}

Device Info:
Platform: ${platform}
Language: ${language}
Screen: ${screenResolution}
Window: ${windowSize}
Vendor: ${vendor}

User Agent: ${userAgent}
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
