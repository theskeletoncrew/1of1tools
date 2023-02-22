import {
  getHandleAndRegistryKey,
  getHashedName,
  getNameAccountKey,
  getTwitterRegistry,
  NameRegistryState,
  NAME_PROGRAM_ID,
  performReverseLookup,
} from "@bonfida/spl-name-service";
import { Connection, PublicKey } from "@solana/web3.js";
import { OneOfOneToolsClient } from "api-client";
import { tryPublicKey } from "utils";
import { clusterApiUrl, network } from "./network";

const SOL_TLD_AUTHORITY = "58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx";

export const resolveWalletAddress = async (
  address: string
): Promise<PublicKey | null> => {
  try {
    const endpoint = clusterApiUrl(network);
    const connection = new Connection(endpoint);

    if (address.startsWith("@")) {
      const handle = address.substring(1);
      const registry = await getTwitterRegistry(connection, handle);
      return registry.owner;
    } else if (address.endsWith(".sol")) {
      const hashedName = await getHashedName(address.replace(".sol", ""));
      const nameAccountKey = await getNameAccountKey(
        hashedName,
        undefined,
        new PublicKey(SOL_TLD_AUTHORITY)
      );
      const owner = await NameRegistryState.retrieve(
        connection,
        nameAccountKey
      );
      address = owner.registry.owner.toBase58();
    }
  } catch (error) {
    console.log(error);
  }

  return tryPublicKey(address);
};

export const loadBonfidaName = async (
  walletAddress: string
): Promise<string | undefined> => {
  try {
    const namesRes = await OneOfOneToolsClient.walletNames(walletAddress);
    if (namesRes.isOk()) {
      const names = namesRes.value;
      if (namesRes.value.length > 0) {
        return names[0];
      }
    } else {
      console.log(namesRes.error.message);
    }
  } catch (error) {
    console.log(error);
  }
  return undefined;
};

export const loadTwitterName = async (
  walletAddress: string
): Promise<string | undefined> => {
  try {
    const walletPublicKey = tryPublicKey(walletAddress);
    if (walletPublicKey) {
      const endpoint = clusterApiUrl(network);
      const connection = new Connection(endpoint);
      const [handle, registryKey] = await getHandleAndRegistryKey(
        connection,
        walletPublicKey
      );
      return handle;
    }
  } catch (error) {
    console.log(error);
  }
  return undefined;
};

async function findOwnedNameAccountsForUser(
  connection: Connection,
  userAccount: PublicKey
): Promise<PublicKey[]> {
  const filters = [
    {
      memcmp: {
        offset: 32,
        bytes: userAccount.toBase58(),
      },
    },
  ];
  const accounts = await connection.getProgramAccounts(NAME_PROGRAM_ID, {
    filters,
  });
  return accounts.map((a) => a.pubkey);
}
