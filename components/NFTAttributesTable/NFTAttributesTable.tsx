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
          <div className="overflow-hidden">
            <p className="text-xs uppercase w-full break-words mb-2">
              {attribute.traitType ?? attribute.trait_type}
            </p>
            <p className="text-indigo-300 w-full break-words">
              {attribute.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NFTAttributesTable;
