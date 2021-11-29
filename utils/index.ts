import { web3 } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export type AccountData<T> = {
  pubkey: PublicKey;
  parsed: T;
};

export function shortenedAddress(
  publicKey: string | undefined,
  extraSmall: boolean = false
): string {
  if (publicKey) {
    if (extraSmall) {
      return publicKey.slice(0, 3) + "..." + publicKey.slice(-3);
    } else {
      return publicKey.slice(0, 5) + "..." + publicKey.slice(-5);
    }
  }
  return "";
}

export const tryPublicKey = (
  publicKeyString: web3.PublicKey | string | string[] | undefined | null
): web3.PublicKey | null => {
  if (publicKeyString instanceof web3.PublicKey) return publicKeyString;
  if (!publicKeyString) return null;
  try {
    return new web3.PublicKey(publicKeyString);
  } catch (e) {
    return null;
  }
};

export function shortPubKey(
  pubkey: web3.PublicKey | string | null | undefined
) {
  return shortenedAddress(pubkey?.toString());
}

export function pubKeyUrl(
  pubkey: web3.PublicKey | string | null | undefined,
  cluster: string
) {
  if (!pubkey) return "https://explorer.solana.com";
  return `https://explorer.solana.com/address/${pubkey.toString()}${
    cluster === "devnet" ? "?cluster=devnet" : ""
  }`;
}

export function txUrl(
  pubkey: web3.PublicKey | string | null | undefined,
  cluster: string
) {
  if (!pubkey) return "https://explorer.solana.com";
  return `https://explorer.solana.com/tx/${pubkey.toString()}${
    cluster === "devnet" ? "?cluster=devnet" : ""
  }`;
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function notEmptyOrEmptyString(
  value: string | null | undefined
): value is string {
  return value !== null && value !== undefined && value !== "";
}
