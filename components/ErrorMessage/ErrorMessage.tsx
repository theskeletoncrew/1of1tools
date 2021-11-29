import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Props {
  title: string;
}

const ErrorMessage: React.FC<Props> = ({ title }) => {
  return (
    <div className="px-4 py-40 flex flex-col gap-4 text-center text-xl justify-center items-center text-indigo-400">
      <ExclamationTriangleIcon className="w-10 h-10" />
      <p>{title}</p>
    </div>
  );
};

export default ErrorMessage;
