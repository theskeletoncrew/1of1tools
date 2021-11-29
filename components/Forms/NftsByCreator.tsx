import { Form } from "components/Forms/Form";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

interface NftsByCreatorInput {
  creatorAddress: string;
}

const schema = yup
  .object({
    creatorAddress: yup.string().trim().required("This field is required"),
  })
  .required();

export const NftsByCreatorForm: React.FC = () => {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<NftsByCreatorInput>({
    resolver: yupResolver(schema),
    defaultValues: {},
  });

  const router = useRouter();

  const onSubmit = async (data: NftsByCreatorInput) => {
    router.push(`/creator/${data.creatorAddress}`);
    return true;
  };

  const useExample = () => {
    setValue("creatorAddress", "FD63BTdLuugA3S4TUsYxqiUqXvkWp58vAhTreo6Uj1sS");
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
            id="creatorAddress"
            type="text"
            placeholder="Creator Address"
            className="mt-1 block w-full shadow-sm rounded-xl text-center"
            {...register("creatorAddress")}
          />
          {errors.creatorAddress && (
            <span className=" text-red-600 text-xs">
              {errors.creatorAddress.message}
            </span>
          )}
        </div>
        <div className="text-sm text-center text-slate-400 mt-2 flex gap-1 justify-center items-center ">
          <span>try:</span>
          <a href="#" onClick={useExample}>
            🎨 <span className="underline">Reza Afshar</span>
          </a>
        </div>
      </div>
    </Form>
  );
};
