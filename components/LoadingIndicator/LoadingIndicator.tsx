import { LoaderIcon } from "react-hot-toast";

interface Props {
  title?: string;
}

const LoadingIndicator: React.FC<Props> = ({ title = "Loading More..." }) => {
  return (
    <div className="flex gap-2 justify-center items-center py-10 text-white text-md">
      <LoaderIcon />
      <span>{title}</span>
    </div>
  );
};

export default LoadingIndicator;
