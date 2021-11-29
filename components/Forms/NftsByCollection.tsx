import { Form } from "components/Forms/Form";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

interface NftsByCollectionInput {
  collectionAddress: string;
}

const schema = yup
  .object({
    collectionAddress: yup.string().trim().required("This field is required"),
  })
  .required();

export const NftsByCollectionForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NftsByCollectionInput>({
    resolver: yupResolver(schema),
    defaultValues: {},
  });

  const router = useRouter();

  const onSubmit = async (data: NftsByCollectionInput) => {
    router.push(`/collection/${data.collectionAddress}`);
    return true;
  };

  const useExample = () => {
    setValue(
      "collectionAddress",
      "A2eGyBzeSJuQo43UWe8bhJTAj8J7j9duDxnV75r8BZLT"
    );
  };

  return (
    <Form
      handleSubmit={handleSubmit}
      submit={onSubmit}
      submitButtonText="Search"
    >
      <div className="p-6">
        <div>
          <input
            id="walletAddress"
            type="text"
            placeholder="Verified Collection Address"
            className="mt-1 block w-full shadow-sm rounded-xl text-center"
            {...register("collectionAddress")}
          />
          {errors.collectionAddress && (
            <span className=" text-red-600 text-xs">
              {errors.collectionAddress.message}
            </span>
          )}
          <div className="text-sm text-center text-slate-400 mt-2 flex gap-1 justify-center items-center ">
            <span>try:</span>
            <a href="#" onClick={useExample}>
              👾 <span className="underline">Monster Friends by zen0m</span>
            </a>
          </div>
        </div>
      </div>
    </Form>
  );
};
