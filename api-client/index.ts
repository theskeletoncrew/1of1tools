import { Result, ok, err } from "neverthrow";
import { OneofOneToolsAPIError } from "models/apiError";
import { NFTMetadata } from "models/nftMetadata";
import { NFTEvent } from "models/nftEvent";
import { PaginationToken } from "models/paginationToken";
import { NotificationSetting } from "models/notificationSetting";

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

  export async function nftsCreatedBy(
    creatorAddress: string,
    limit: number = 10,
    page?: PaginationToken
  ): Promise<
    Result<{ events: NFTEvent[]; paginationToken: PaginationToken }, Error>
  > {
    try {
      const response = await fetch(`${SERVER_URL}/api/nfts/created-by`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorAddress: creatorAddress,
          limit: limit,
          page: page,
        }),
      });
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

  export async function nftsOwnedBy(
    walletAddress: string,
    page: number = 1
  ): Promise<Result<{ mints: string[]; numberOfPages: number }, Error>> {
    try {
      const response = await fetch(`${SERVER_URL}/api/nfts/owned-by`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          page: page,
        }),
      });
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
    mintAccount: string,
    limit: number = 10,
    page?: PaginationToken
  ): Promise<
    Result<{ events: NFTEvent[]; paginationToken: PaginationToken }, Error>
  > {
    try {
      const response = await fetch(`${SERVER_URL}/api/nfts/events`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mintAccount: mintAccount,
          limit: limit,
          page: page,
        }),
      });
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
      const response = await fetch(`${SERVER_URL}/api/collections/mintlist`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionAddress: collectionAddress,
        }),
      });
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
      const response = await fetch(`${SERVER_URL}/api/accounts/names`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        return ok(result.domainNames);
      }
      return err(new OneofOneToolsAPIError(response, result));
    } catch (e) {
      return err(new Error(e instanceof Error ? e.message : ""));
    }
  }

  export async function creatorNotificationSubscriptionSettings(
    accountAddress: string
  ): Promise<Result<NotificationSetting | null, Error>> {
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

  export async function setCreatorNotificationSubscriptionSettings(
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

  export async function nftNotificationSubscriptionSettings(
    mintAddress: string
  ): Promise<Result<NotificationSetting | null, Error>> {
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

  export async function setNftNotificationSubscriptionSettings(
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

      console.log(result);

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
}
