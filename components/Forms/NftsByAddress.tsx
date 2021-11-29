import { Form } from "components/Forms/Form";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { notEmptyOrEmptyString, tryPublicKey } from "utils";

interface NftsByAddressInput {
  mintAddressesStr: string | null;
}

const schema = yup
  .object({
    mintAddressesStr: yup.string().trim().required("This field is required"),
  })
  .required();

export const NftsByAddressForm: React.FC = () => {
  const {
    register,
    setValue,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<NftsByAddressInput>({
    resolver: yupResolver(schema),
    defaultValues: { mintAddressesStr: "" },
  });

  const router = useRouter();

  const onSubmit = async (data: NftsByAddressInput) => {
    const mintAddresses =
      data.mintAddressesStr
        ?.split(/\s+/)
        .map((w) => w.trim())
        .filter(notEmptyOrEmptyString)
        .filter((a) => tryPublicKey(a) != null) ?? null;

    if (mintAddresses && mintAddresses.length > 0) {
      if (mintAddresses.length == 1) {
        router.push(`/nft/${mintAddresses[0]}`);
      } else {
        router.push({
          pathname: "/nfts",
          query: {
            mintAddresses: mintAddresses,
          },
        });
      }
    } else {
      setError("mintAddressesStr", {
        message: "No valid mint addresses provided.",
      });
    }

    return true;
  };

  const useExample = () => {
    setValue(
      "mintAddressesStr",
      `HPAS5JVS2t2M4dzT6VBbCdzZRK9odQnRdEVsy4U1WsJQ
HGaJJXgeMU2WMU59dZ2FaCKFX3Xu5Xvg9Lx5TBfL214H
BWi3KC9gDrzadwSz7ZiVGZSQMH8ruo9MoBc4TrV1nR6c
FQtH9rpH4Zwn1zbn89EUwkWfqR35exFeTppS4YoPKmaR
GAswVQoAtEo5T49NV8vmXqdSs5hhaF1j6X8ZoMp8k15r`
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
          <textarea
            id="mintAddressesStr"
            placeholder="Mint Addresses (1 per line)"
            className="mt-1 block w-full shadow-sm rounded-xl"
            rows={3}
            cols={64}
            {...register("mintAddressesStr")}
          />
          {errors.mintAddressesStr && (
            <span className=" text-red-600 text-xs">
              {errors.mintAddressesStr.message}
            </span>
          )}
        </div>
        <div className="text-sm text-center text-slate-400 mt-2 flex gap-1 justify-center items-center ">
          <span>try:</span>
          <a href="#" onClick={useExample}>
            💀 <span className="underline">Skeleton Crew Skulls</span>
          </a>
        </div>
      </div>
    </Form>
  );
};
