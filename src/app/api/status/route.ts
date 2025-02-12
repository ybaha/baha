import { sendTelegramMessage } from "@/lib/sendTelegramMessage";
import { decrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    // Decrypt and parse the payload
    const decryptedData = JSON.parse(atob(data));
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
      timestamp,
    } = decryptedData;

    const message = `
📱 New Visit (${new Date(timestamp).toLocaleString()}):
🌍 Location: ${city}, ${region}, ${country}
📍 Coordinates: ${location}
🔍 IP: ${ip}

💻 Device:
• Platform: ${platform}
• Language: ${language}
• Screen: ${screenResolution}
• Window: ${windowSize}
• Vendor: ${vendor}

🔎 UA: ${userAgent}
    `.trim();

    await sendTelegramMessage(message);

    // Return a generic status response
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { status: "ok" }, // Still return OK to mask errors
      { status: 200 }
    );
  }
}
