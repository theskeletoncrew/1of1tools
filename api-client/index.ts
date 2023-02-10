import { Result, ok, err } from "neverthrow";
import { OneofOneToolsAPIError } from "models/apiError";
import { NFTMetadata } from "models/nftMetadata";
import { NFTEvent, OneOfOneNFTEvent } from "models/nftEvent";
import { PaginationToken } from "models/paginationToken";
import {
  DialectNotificationSetting,
  DiscordGuildNotificationSetting,
} from "models/notificationSetting";
import { Account } from "models/account";
import { Collection } from "models/collection";
import { CollectionSortType } from "components/CollectionSort/CollectionSort";
import { NFTListings } from "models/nftListings";

export const SERVER_URL =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "https://1of1.tools";

export namespace OneOfOneToolsClient {
  export async function nfts(
    mintAccounts: string[],
    retry: boolean = true
  ): Promise<Result<NFTMetadata[], Error>> {
    if (mintAccounts.length == 0) {
      return ok([]);
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/nfts/metadata`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mintAccounts: mintAccounts,
        }),
      });
      const responseJSON = await response.json();

      if (response.ok) {
        // retry any nfts we couldnt pull
        let nfts = responseJSON.nfts as NFTMetadata[];

        if (retry) {
          const failedNfts = nfts.filter(
            (n) => n.onChainData == null || n.offChainData == null
          );
          if (failedNfts.length > 0) {
            const retryNftsRes = await OneOfOneToolsClient.nfts(
              failedNfts.map((n) => n.mint),
              false
            );
            if (retryNftsRes.isOk()) {
              const retryNfts = retryNftsRes.value.filter(
                (n) => n.onChainData == null || n.offChainData == null
              );
              retryNfts.forEach((retryNft) => {
                const index = nfts.findIndex((n) => n.mint === retryNft.mint);
                if (index != -1) {
                  nfts[index] = retryNft;
                }
              });
            }
          }
        }

        // finally anything we couldnt populate in the retry, we should just filter out
        nfts = nfts.filter(
          (n) => n.onChainData != null && n.offChainData != null
        );
        return ok(nfts);
      }
      return err(new OneofOneToolsAPIError(response, responseJSON));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function creatorNFTs(
    creatorAddress: string,
    limit: number = 10,
    page?: PaginationToken
  ): Promise<
    Result<{ events: NFTEvent[]; paginationToken: PaginationToken }, Error>
  > {
    try {
      let params: Record<string, string> = {
        limit: limit.toString(),
      };
      if (page) {
        params.page = page;
      }
      const query = new URLSearchParams(params).toString();

      const response = await fetch(
        `${SERVER_URL}/api/creators/${creatorAddress}/nfts?${query}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const responseJSON = await response.json();

      if (response.ok) {
        return ok({
          events: responseJSON.events,
          paginationToken: responseJSON.paginationToken,
        });
      }
      return err(new OneofOneToolsAPIError(response, responseJSON));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function walletNFTs(
    walletAddress: string,
    page: number = 1
  ): Promise<Result<{ mints: string[]; numberOfPages: number }, Error>> {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/wallets/${walletAddress}/nfts?page=${page}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const responseJSON = await response.json();

      if (response.ok) {
        return ok({
          mints: responseJSON.mints,
          numberOfPages: responseJSON.numberOfPages,
        });
      }
      return err(new OneofOneToolsAPIError(response, responseJSON));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function events(
    mintAddress: string,
    isImported: boolean,
    limit: number = 10,
    page?: PaginationToken
  ): Promise<
    Result<{ events: NFTEvent[]; paginationToken: PaginationToken }, Error>
  > {
    let params: Record<string, string> = {
      limit: limit.toString(),
      isImported: isImported ? "1" : "0",
    };
    if (page) {
      params.page = page;
    }
    const query = new URLSearchParams(params).toString();

    try {
      const response = await fetch(
        `${SERVER_URL}/api/nfts/${mintAddress}/events?${query}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      if (response.ok) {
        return ok({
          events: result.events,
          paginationToken: result.paginationToken,
        });
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function mintList(
    collectionAddress: string
  ): Promise<Result<string[], Error>> {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/collections/${collectionAddress}/mintlist`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      if (response.ok) {
        return ok(result.mintlist.map((m: any) => m.mint));
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function walletNames(
    walletAddress: string
  ): Promise<Result<string[], Error>> {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/wallets/${walletAddress}/names`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      if (response.ok) {
        return ok(result.domainNames);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function dialectCreatorNotificationSubscriptionSettings(
    accountAddress: string
  ): Promise<Result<DialectNotificationSetting | null, Error>> {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/notifications/creators/${accountAddress}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      if (response.ok) {
        return ok(result.settings);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function setDialectCreatorNotificationSubscriptionSettings(
    accountAddress: string,
    deliveryAddress: string,
    formfunctionNotifications: boolean,
    exchangeArtNotifications: boolean
  ): Promise<Result<null, Error>> {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/creators`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountAddress: accountAddress,
          deliveryAddress: deliveryAddress,
          formfunctionNotifications: formfunctionNotifications,
          exchangeArtNotifications: exchangeArtNotifications,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        return ok(null);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function discordCreatorNotificationSubscriptionSettings(
    accountAddress: string
  ): Promise<Result<DiscordGuildNotificationSetting[], Error>> {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/notifications/creators/${accountAddress}?deliveryType=discord`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      if (response.ok) {
        return ok(result.settings);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function setDiscordCreatorNotificationSubscriptionSettings(
    accountAddress: string,
    subscriptions: DiscordGuildNotificationSetting[]
  ): Promise<Result<null, Error>> {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/creators`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountAddress: accountAddress,
          guildSubscriptions: subscriptions,
          deliveryType: "discord",
        }),
      });
      const result = await response.json();

      if (response.ok) {
        return ok(null);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function dialectNFTNotificationSubscriptionSettings(
    mintAddress: string
  ): Promise<Result<DialectNotificationSetting | null, Error>> {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/notifications/nfts/${mintAddress}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      if (response.ok) {
        return ok(result.settings);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function setDialectNftNotificationSubscriptionSettings(
    mintAddress: string,
    deliveryAddress: string,
    formfunctionNotifications: boolean,
    exchangeArtNotifications: boolean
  ): Promise<Result<null, Error>> {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/nfts`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mintAddress: mintAddress,
          deliveryAddress: deliveryAddress,
          formfunctionNotifications: formfunctionNotifications,
          exchangeArtNotifications: exchangeArtNotifications,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        return ok(null);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function dialectBoutiqueNotificationSubscriptionSettings(): Promise<
    Result<DialectNotificationSetting | null, Error>
  > {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/boutique`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();

      if (response.ok) {
        return ok(result.settings);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function setDialectBoutiqueNotificationSubscriptionSettings(
    deliveryAddress: string
  ): Promise<Result<null, Error>> {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/boutique`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryAddress: deliveryAddress,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        return ok(null);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function discordBoutiqueNotificationSubscriptionSettings(): Promise<
    Result<DiscordGuildNotificationSetting[], Error>
  > {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/notifications/boutique?deliveryType=discord`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      if (response.ok) {
        return ok(result.settings);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function setDiscordBoutiqueNotificationSubscriptionSettings(
    subscriptions: DiscordGuildNotificationSetting[]
  ): Promise<Result<null, Error>> {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/boutique`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guildSubscriptions: subscriptions,
          deliveryType: "discord",
        }),
      });
      const result = await response.json();

      if (response.ok) {
        return ok(null);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function mint(
    metadata: any,
    recipientEmail: string
  ): Promise<Result<{ id: string; isComplete: boolean }, Error>> {
    try {
      const response = await fetch(`${SERVER_URL}/api/mint`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: metadata,
          recipientEmail: recipientEmail,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        return ok({
          id: result.id,
          isComplete: result.onChain.status == "success",
        });
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function mintStatus(
    uploadId: string
  ): Promise<Result<{ mintAddress: string; isComplete: boolean }, Error>> {
    try {
      const response = await fetch(`${SERVER_URL}/api/mint/${uploadId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();

      if (response.ok) {
        return ok({
          mintAddress: result.onChain.mintHash,
          isComplete: result.onChain.status == "success",
        });
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function createAccount(
    isCreator: boolean,
    username: string,
    email: string | undefined,
    discordId: string | undefined,
    twitterUsername: string | undefined
  ): Promise<Result<null, Error>> {
    try {
      const response = await fetch(`${SERVER_URL}/api/accounts`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCreator: isCreator,
          username: username,
          email: email ?? null,
          discordId: discordId ?? null,
          twitterUsername: twitterUsername ?? null,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        return ok(null);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function getCurrentUserAccount(): Promise<
    Result<Account, Error>
  > {
    try {
      const response = await fetch(`${SERVER_URL}/api/accounts`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();

      if (response.ok) {
        return ok(result.account);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function connectDiscord(
    discordAccessToken: string,
    discordTokenType: string,
    discordRefreshToken: string,
    guildId: string,
    cookie: string | undefined
  ): Promise<Result<boolean, Error>> {
    const response = await fetch(`${SERVER_URL}/api/accounts/connect/discord`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
        Cookie: cookie ?? "",
      },
      body: JSON.stringify({
        discordAccessToken: discordAccessToken,
        discordTokenType: discordTokenType,
        discordRefreshToken: discordRefreshToken,
        guildId: guildId,
      }),
    });
    const result = await response.json();
    if (response.ok) {
      return ok(result);
    }
    return err(new Error(result.message));
  }

  export async function selectDiscordChannel(
    guildId: string,
    channelId: string
  ): Promise<Result<boolean, Error>> {
    const response = await fetch(`${SERVER_URL}/api/accounts/discord-channel`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guildId: guildId,
        channelId: channelId,
      }),
    });
    const result = await response.json();
    if (response.ok) {
      return ok(result);
    }
    return err(new Error(result.message));
  }

  export async function disconnectDiscordGuild(
    guildId: string
  ): Promise<Result<boolean, Error>> {
    const response = await fetch(
      `${SERVER_URL}/api/accounts/discord-guild/${guildId}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const result = await response.json();
    if (response.ok) {
      return ok(result);
    }
    return err(new Error(result.message));
  }

  export async function boutiqueCollection(
    slug: string
  ): Promise<Result<Collection, Error>> {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/collections/boutique/${slug}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const responseJSON = await response.json();

      if (response.ok) {
        return ok(responseJSON.collection);
      }
      return err(new OneofOneToolsAPIError(response, responseJSON));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function boutiqueCollections(options: {
    sort?: CollectionSortType | undefined;
    cursor?: string | null | undefined;
    limit?: number | null;
  }): Promise<Result<Collection[], Error>> {
    try {
      let params: Record<string, string> = {};
      if (options.limit) {
        params.limit = options.limit.toString();
      }
      if (options.cursor) {
        params.cursor = options.cursor.toString();
      }
      if (options.sort) {
        params.sort = options.sort.toString();
      }
      const query = new URLSearchParams(params).toString();

      const response = await fetch(
        `${SERVER_URL}/api/collections/boutique?${query}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const responseJSON = await response.json();

      if (response.ok) {
        return ok(responseJSON.collections);
      }
      return err(new OneofOneToolsAPIError(response, responseJSON));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function latestBoutiqueEvents(options: {
    limit?: number | null;
  }): Promise<
    Result<{ events: OneOfOneNFTEvent[]; nfts: NFTMetadata[] }, Error>
  > {
    try {
      let params: Record<string, string> = {};
      if (options.limit) {
        params.limit = options.limit.toString();
      }
      const query = new URLSearchParams(params).toString();

      const response = await fetch(
        `${SERVER_URL}/api/collections/boutique/events?${query}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const responseJSON = await response.json();

      if (response.ok) {
        return ok({ events: responseJSON.events, nfts: responseJSON.nfts });
      }
      return err(new OneofOneToolsAPIError(response, responseJSON));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function addBoutiqueCollection(
    collection: Collection
  ): Promise<Result<Collection[], Error>> {
    try {
      const response = await fetch(`${SERVER_URL}/api/collections/boutique`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ collection: collection }),
      });
      const responseJSON = await response.json();

      if (response.ok) {
        return ok(responseJSON.collections);
      }
      return err(new OneofOneToolsAPIError(response, responseJSON));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function activeBoutiqueListings(
    slug: string
  ): Promise<Result<NFTListings[], Error>> {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/collections/boutique/${slug}/listings`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const responseJSON = await response.json();

      if (response.ok) {
        return ok(responseJSON.listings);
      }
      return err(new OneofOneToolsAPIError(response, responseJSON));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function activeListingNFT(
    mintAddress: string,
    firstVerifiedCreator: string
  ): Promise<Result<NFTListings, Error>> {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/nfts/${mintAddress}/listings?firstVerifiedCreator=${firstVerifiedCreator}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const responseJSON = await response.json();

      if (response.ok) {
        return ok(responseJSON.listings);
      }
      return err(new OneofOneToolsAPIError(response, responseJSON));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }
}
