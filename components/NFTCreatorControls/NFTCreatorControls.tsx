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
import { Connection, PublicKey } from "@solana/web3.js";
import { toast } from "react-hot-toast";
import { shortPubKey, tryPublicKey } from "utils";
import { proxyDownloadImgUrl } from "utils/imgproxy";
import { clusterApiUrl, network } from "utils/network";

interface Props {
  nft: Nft | Sft | SftWithToken | NftWithToken;
  wallet: WalletContextState;
  imageUrl: string;
}

const NFTCreatorControls: React.FC<Props> = ({ nft, wallet, imageUrl }) => {
  const isOriginal = isNft(nft) && nft.edition.isOriginal;

  const endpoint = clusterApiUrl(network);
  const connection = new Connection(endpoint);
  const mx = Metaplex.make(connection);
  mx.use(walletAdapterIdentity(wallet));

  const updateNft = async () => {
    toast.error("Coming soon.");
    // try {
    //   await mx.nfts().update({
    //     nftOrSft: nft,
    //     name: "",
    //     symbol: "",
    //     uri: "",
    //     sellerFeeBasisPoints: 0,
    //     creators: [{ address: new PublicKey(""), share: 0 }],
    //   });
    //   toast.success("NFT was successfully updated.");
    // } catch (error) {
    //   console.log(error);
    //   const balance = await mx.connection.getBalance(mx.identity().publicKey);
    //   if (balance == 0) {
    //     toast.error(
    //       "Failed to update NFT. Check that you have some SOL to cover transaction fees."
    //     );
    //   } else {
    //     toast.error("Failed to update NFT");
    //   }
    // }
  };

  return (
    <div className="mx-1 flex gap-4">
      <button className="button thinbutton w-full" onClick={updateNft}>
        Update NFT
      </button>
    </div>
  );
};

export default NFTCreatorControls;
