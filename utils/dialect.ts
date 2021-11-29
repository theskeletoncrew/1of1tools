import {
  BlockchainType,
  CreateThreadCommand,
  Dapp,
  Dialect,
  DialectCloudEnvironment,
  DialectSdk,
  SendMessageCommand,
  Thread,
  ThreadMemberScope,
} from "@dialectlabs/sdk";

import {
  Solana,
  SolanaSdkFactory,
  NodeDialectSolanaWalletAdapter,
} from "@dialectlabs/blockchain-sdk-solana";

const environment: DialectCloudEnvironment = "production";

export function createDialectSdk(): DialectSdk<Solana> {
  const sdk: DialectSdk<Solana> = Dialect.sdk(
    {
      environment,
    },
    SolanaSdkFactory.create({
      wallet: NodeDialectSolanaWalletAdapter.create(),
    })
  );
  sdk.dapps.create;
  return sdk;
}

export async function createDapp(
  sdk: DialectSdk<Solana>,
  name: string,
  description: string,
  websiteUrl?: string,
  avatarUrl?: string,
  heroUrl?: string,
  blockchainType: BlockchainType = "SOLANA"
): Promise<Dapp> {
  const dapp = await sdk.dapps.create({
    name,
    description,
    websiteUrl,
    avatarUrl,
    heroUrl,
    blockchainType,
  });
  return dapp;
}

export async function findOrCreateSolanaThread(
  sdk: DialectSdk<Solana>,
  recipient: string
): Promise<{ thread: Thread | null; isNew: boolean }> {
  const thread: Thread | null = await sdk.threads.find({
    otherMembers: [recipient],
  });
  if (thread) {
    return { thread: thread, isNew: false };
  }

  const command: CreateThreadCommand = {
    encrypted: false,
    me: {
      scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
    },
    otherMembers: [
      {
        address: recipient,
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
    ],
  };
  try {
    const newThread = await sdk.threads.create(command);
    return { thread: newThread, isNew: true };
  } catch {
    return { thread: null, isNew: false };
  }
}

export async function sendMessage(thread: Thread, text: string): Promise<void> {
  const command: SendMessageCommand = {
    text,
  };
  return await thread.send(command);
}
