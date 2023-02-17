import { NFTAttribute } from "models/nftMetadata";

interface Props {
  attributes: NFTAttribute[];
}

const NFTAttributesTable: React.FC<Props> = ({ attributes }) => {
  console.log(attributes);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {attributes?.map((attribute, i) => (
        <div
          key={i}
          className="px-4 pt-2 pb-3 rounded-lg bg-white bg-opacity-5 text-center focus:outline-none"
        >
          <span className="relative">
            <span className="text-xs uppercase">
              {attribute.traitType ?? attribute.trait_type}
            </span>
            <br />
            <span className="text-indigo-300">{attribute.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default NFTAttributesTable;
