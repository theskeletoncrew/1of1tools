interface Props {
  nftAddress: string;
}

const NFTCreatorControls: React.FC<Props> = ({ nftAddress }) => {
  return (
    <div className="mx-1 flex gap-4">
      <a href={`/nft/${nftAddress}/edit`} className="w-full">
        <button className="button thinbutton w-full">Update NFT</button>
      </a>
    </div>
  );
};

export default NFTCreatorControls;
