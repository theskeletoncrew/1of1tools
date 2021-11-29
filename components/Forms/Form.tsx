import { useState } from "react";

interface Props {
  handleSubmit: any;
  submit: (data: any) => Promise<boolean>;
  submitButtonText?: string;
  children?: JSX.Element | JSX.Element[] | null;
}

export const Form: React.FC<Props> = ({
  handleSubmit,
  submit,
  submitButtonText = "Submit",
  children,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const isSuccessful = await submit(data);
    setIsSubmitting(false);
  };

  return (
    <form action="#" method="POST" onSubmit={handleSubmit(onSubmit)}>
      <fieldset
        disabled={isSubmitting}
        className={isSubmitting ? "opacity-50" : ""}
      >
        <div>
          {children}

          <div className="pt-4 pb-6 text-center">
            <button
              type="submit"
              className={
                (isSubmitting
                  ? "bg-gray-600"
                  : "bg-indigo-600 hover:bg-indigo-700 ") +
                "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              }
            >
              {submitButtonText}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
};
