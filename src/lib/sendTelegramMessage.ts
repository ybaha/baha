"use server";

const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

export const sendTelegramMessage = async (message: string) => {
  const timestamp = new Date().toLocaleTimeString("tr-TR");

  if (process.env.NODE_ENV === "development") {
    console.log("Telegram message:", message, timestamp);

    return;
  }

  try {
    await fetch(TELEGRAM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: 1912767327,
        text: `${message}\n${timestamp}`,
      }),
    });
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
};
