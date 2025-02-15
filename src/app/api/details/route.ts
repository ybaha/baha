import { NextResponse } from "next/server";

type IpInfoResponse = {
  error: boolean;
  reason: string;
  ip: string;
  city: string;
  region: string;
  country_name: string;
  latitude: number;
  longitude: number;
};

export async function GET() {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    if (data.error && data.reason === "RateLimited") {
      const response = await fetch("https://ipinfo.io/json");
      const data = await response.json();

      const [latitude, longitude] = data.loc.split(",").map(Number);

      return NextResponse.json({
        data: {
          ip: data.ip,
          city: data.city,
          region: data.region,
          country_name: data.country,
          latitude,
          longitude,
        } as IpInfoResponse,
      });
    }

    return NextResponse.json(data as IpInfoResponse);
  } catch (error) {
    console.error("Error fetching geolocation:", error);
    return NextResponse.json(
      { error: "Failed to fetch geolocation data" },
      { status: 500 }
    );
  }
}
