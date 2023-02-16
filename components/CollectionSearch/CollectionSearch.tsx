import { useState } from "react";

interface Props {
  searchTerm: string;
  didChangeSearch: (searchTerm: string | undefined) => void;
}

const CollectionSearch: React.FC<Props> = ({ searchTerm, didChangeSearch }) => {
  const [search, setSearch] = useState<string>();
  return (
    <div className="flex items-center gap-2 h-full max-w-[50%]">
      <span className="whitespace-nowrap text-indigo-500">Search:</span>
      <input
        type="search"
        id="search"
        name="search"
        className="rounded-lg w-full"
        defaultValue={searchTerm}
        onChange={(e) => didChangeSearch(e.target.value)}
      />
    </div>
  );
};

export default CollectionSearch;
