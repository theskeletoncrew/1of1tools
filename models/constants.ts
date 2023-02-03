export namespace Constants {
  export const PRODUCT_NAME = "1of1 Tools";
  export const TAGLINE = "Tagline";

  export const HOST =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://1of1tools.com";

  export const DISCORD_API = "https://discord.com/api";

  export const DISCORD_APP_ID = process.env.NEXT_PUBLIC_DISCORD_APP_ID || "";
  export const DISCORD_OAUTH_REDIRECT_URI = `${HOST}/connect/discord`;
  export const DISCORD_RETURN_URL = `${HOST}/connect/discord`;

  // send messages, embed links, attach files (?)
  export const DISCORD_BOT_PERMISSIONS_INTEGER = 18432;
  export const DISCORD_BOT_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_APP_ID}&permissions=${DISCORD_BOT_PERMISSIONS_INTEGER}&response_type=code&scope=bot%20identify%20guilds&redirect_uri=${encodeURIComponent(
    DISCORD_RETURN_URL
  )}`;
  export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
}
