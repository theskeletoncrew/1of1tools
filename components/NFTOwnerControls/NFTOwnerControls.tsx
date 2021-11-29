import {
  isNft,
  Metaplex,
  Nft,
  NftWithToken,
  Sft,
  SftWithToken,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { toast } from "react-hot-toast";
import { shortPubKey, tryPublicKey } from "utils";
import { proxyDownloadImgUrl } from "utils/imgproxy";
import { clusterApiUrl, network } from "utils/network";

interface Props {
  nft: Nft | Sft | SftWithToken | NftWithToken;
  wallet: WalletContextState;
  imageUrl: string;
}

const NFTOwnerControls: React.FC<Props> = ({ nft, wallet, imageUrl }) => {
  const isOriginal = isNft(nft) && nft.edition.isOriginal;

  const endpoint = clusterApiUrl(network);
  const connection = new Connection(endpoint);
  const mx = Metaplex.make(connection);
  mx.use(walletAdapterIdentity(wallet));

  const sendNft = async () => {
    const recipientAddress = prompt("Enter recipient's Solana address:");
    if (!recipientAddress || recipientAddress.trim().length == 0) {
      return;
    }

    const recipientPublicKey = tryPublicKey(recipientAddress);
    if (recipientPublicKey) {
      try {
        await mx.nfts().send({
          mintAddress: nft.address,
          toOwner: recipientPublicKey,
        });
        toast.success("NFT was sent to " + shortPubKey(recipientAddress));
      } catch (error) {
        console.log(error);
        const balance = await mx.connection.getBalance(mx.identity().publicKey);
        if (balance == 0) {
          toast.error(
            "Failed to send NFT. Check that you have some SOL to cover transaction fees."
          );
        } else {
          toast.error("Failed to send NFT");
        }
      }
    } else {
      toast.error("The address you entered was not a valid Solana public key.");
    }
  };

  const burnNft = async () => {
    if (
      confirm(
        `Are you sure you want to burn "${nft.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await mx.nfts().delete({
          mintAddress: nft.address,
        });
        toast.success(`"${nft.name}" was burned`);
      } catch (error) {
        console.log(error);
        const balance = await mx.connection.getBalance(mx.identity().publicKey);
        if (balance == 0) {
          toast.error(
            "Failed to burn NFT. Check that you have some SOL to cover transaction fees."
          );
        } else {
          toast.error("Failed to burn NFT");
        }
      }
    }
  };

  return (
    <div className="mx-1 flex gap-4">
      <button className="button thinbutton w-full" onClick={sendNft}>
        Send NFT
      </button>
      <a
        href={proxyDownloadImgUrl(imageUrl)}
        target="_blank"
        rel="noreferrer"
        className="w-full"
      >
        <button className="button thinbutton w-full">Download Image</button>
      </a>
      {isOriginal && (
        <button
          className="button thinbutton destructivebutton w-full"
          onClick={burnNft}
        >
          Burn NFT
        </button>
      )}
    </div>
  );
};

export default NFTOwnerControls;
