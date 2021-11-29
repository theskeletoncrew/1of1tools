import { Form } from "components/Forms/Form";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

interface NftsByWalletOwnerInput {
  walletAddress: string;
}

const schema = yup
  .object({
    walletAddress: yup.string().trim().required("This field is required"),
  })
  .required();

export const NftsByWalletOwnerForm: React.FC = () => {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<NftsByWalletOwnerInput>({
    resolver: yupResolver(schema),
    defaultValues: {},
  });

  const router = useRouter();

  const onSubmit = async (data: NftsByWalletOwnerInput) => {
    router.push(`/wallet/${data.walletAddress}`);
    return true;
  };

  const useExample = () => {
    setValue("walletAddress", "7FUjffHVu6aCR1cBnjauoEH6bvTKfUuizqvAXeUG8kHp");
  };

  const useExample2 = () => {
    setValue("walletAddress", "@A2KDeFi");
  };

  return (
    <Form
      handleSubmit={handleSubmit}
      submit={onSubmit}
      submitButtonText="Search"
    >
      <div className="p-6 space-y-6">
        <div>
          <input
            id="walletAddress"
            type="text"
            placeholder="Wallet Address"
            className="mt-1 block w-full shadow-sm rounded-xl text-center"
            {...register("walletAddress")}
          />
          {errors.walletAddress && (
            <span className=" text-red-600 text-xs">
              {errors.walletAddress.message}
            </span>
          )}

          <div className="text-sm text-center text-slate-400 mt-2 flex gap-1 justify-center items-center ">
            <span>try:</span>
            <a href="#" onClick={useExample}>
              🧠 <span className="underline">Big Brain Gallery</span>
            </a>
            <span>or</span>
            <a href="#" onClick={useExample2}>
              👻 <span className="underline">@A2KDeFi</span>
            </a>
          </div>
        </div>
      </div>
    </Form>
  );
};
