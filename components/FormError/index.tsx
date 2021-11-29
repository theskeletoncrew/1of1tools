import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { FieldError } from "react-hook-form";

interface Props {
  error?: FieldError | undefined;
}

const FormError: React.FC<Props> = ({ error = undefined }) => {
  return error ? (
    <span className="formError">
      <span aria-label={error.message} role="tooltip">
        <ExclamationCircleIcon className="text-red-400 w-4 h-4" />
      </span>
    </span>
  ) : (
    <></>
  );
};

export default FormError;
