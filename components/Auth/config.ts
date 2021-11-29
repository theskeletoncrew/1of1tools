import { Constants } from "models/constants";

export const AUTH_DOMAIN = process.env.NEXT_PUBLIC_AUTH_DOMAIN || "";

export const signInMessage = (nonce: string, domain: string) =>
  `Welcome to ${Constants.PRODUCT_NAME}!\n\Sign this message to login.\n\n[${domain}||${nonce}]`;

/**
 * Function to parse the payload (msg) from the client and return the nonce and domain used to sign in
 * @param pl payload sent from the client
 * @returns Object -> the nonce and domain to check against the DB
 */
export const parsePayload = (pl: string): { nonce: string; domain: string } => {
  const matches = pl.match(/\[([^|]*)\|\|([^\]]*)\]/);

  if (matches && matches.length >= 3) {
    const domain = matches[1];
    const nonce = matches[2];

    if (nonce && domain) {
      return { nonce, domain };
    }
  }
  return { nonce: "", domain: "" };
};
