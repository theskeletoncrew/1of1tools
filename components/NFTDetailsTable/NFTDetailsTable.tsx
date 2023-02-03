import {
  isNft,
  Nft,
  NftPrintEdition,
  NftWithToken,
  Sft,
  SftWithToken,
} from "@metaplex-foundation/js";
import { NFTMetadataOffChain, NFTMetadataOnChain } from "models/nftMetadata";
import { pubKeyUrl, shortenedAddress, shortPubKey } from "utils";
import { network } from "utils/network";
import { useSession } from "next-auth/react";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";

interface Props {
  onChainData: NFTMetadataOnChain;
  offChainData: NFTMetadataOffChain;
  collectionNft?: Nft;
  nft?: Nft | Sft | SftWithToken | NftWithToken;
  parentNft?: Nft;
  owner?: string;
}

const NFTDetailsTable: React.FC<Props> = ({
  onChainData,
  offChainData,
  collectionNft,
  nft,
  parentNft,
  owner,
}) => {
  const { data: session } = useSession();

  return (
    <table className="w-full text-sm rounded-md">
      <tbody>
        <tr>
          <td className="pr-10">Royalty:</td>
          <td className="text-right text-indigo-300">
            {offChainData.sellerFeeBasisPoints / 100.0}%
          </td>
        </tr>

        <tr>
          <td className="pr-10">Address:</td>
          <td className="text-right text-indigo-300">
            <a href={pubKeyUrl(onChainData.mint, network)}>
              {shortenedAddress(onChainData.mint)}
            </a>
          </td>
        </tr>
        {onChainData.collection && (
          <tr>
            <td className="pr-10">Collection: </td>
            <td className="text-right text-indigo-300">
              <a href={`/collection/${onChainData.collection.key}`}>
                {collectionNft
                  ? collectionNft.name
                  : shortenedAddress(onChainData.collection.key)}
              </a>
            </td>
          </tr>
        )}
        <tr>
          <td className="pr-10">Mutable:</td>
          <td className="text-right text-indigo-300">
            {onChainData.isMutable ? "Yes" : "No"}
          </td>
        </tr>

        {owner && (
          <tr>
            <td className="pr-10">Owner:</td>
            <td className="text-right text-indigo-300">
              <a href={`/wallet/${owner}`}>{shortenedAddress(owner)}</a>
              {session?.user?.id == owner ? " - You! 😎" : ""}
            </td>
          </tr>
        )}

        <tr>
          <td className="pr-10">Update Authority:</td>
          <td className="text-right text-indigo-300">
            <a href={`/creator/${onChainData.updateAuthority.toString()}`}>
              {shortenedAddress(onChainData.updateAuthority)}
            </a>
            {session?.user?.id == onChainData.updateAuthority
              ? " - You! 😎"
              : ""}
          </td>
        </tr>
        {nft && (
          <tr>
            <td className="pr-10">Type:</td>
            <td className="text-right text-indigo-300">
              {isNft(nft) ? (
                !nft.edition.isOriginal ? (
                  <span>
                    Edition #
                    {(nft.edition as NftPrintEdition).number.toString()}{" "}
                    {parentNft && (
                      <>
                        of ( parentNft.edition as NftOriginalEdition
                        ).supply.toString()
                      </>
                    )}
                  </span>
                ) : (
                  "Original 1/1"
                )
              ) : (
                onChainData.tokenStandard ?? "Legacy"
              )}
            </td>
          </tr>
        )}
        <tr>
          <td className="pr-10 align-top">Creators:</td>
          <td className="text-right text-indigo-300 align-top">
            {nft?.creators.map((creator, i) => {
              return (
                <div key={i} className="flex gap-1 justify-end ml-auto w-full">
                  {creator.verified ? (
                    <CheckBadgeIcon className="w-5 h-5" title="Verified" />
                  ) : (
                    ""
                  )}
                  <a href={`/creator/${creator.address}`}>
                    {shortPubKey(creator.address)}
                  </a>
                </div>
              );
            })}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default NFTDetailsTable;
