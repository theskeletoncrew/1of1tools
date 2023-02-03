import { PaintBrushIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { Result } from "neverthrow";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "react-modal";

interface Props {
  isShowing: boolean;
  close: () => void;
  saveAccount: (
    isCreator: boolean,
    username: string,
    email: string | undefined,
    discordId: string | undefined
  ) => Promise<boolean>;
}

const SignupModal: React.FC<Props> = ({ isShowing, close, saveAccount }) => {
  const [isCreatorType, setCreatorType] = useState<boolean>();
  const [username, setUsername] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [discordId, setDiscordId] = useState<string>();

  const save = async () => {
    try {
      if (isCreatorType === undefined) {
        throw new Error("You must select an account type.");
      }

      if (username === undefined || username.length < 3) {
        throw new Error("Please enter a username with at least 3 characters.");
      }

      if (
        email !== undefined &&
        (!email.includes("@") || !email.includes("."))
      ) {
        throw new Error("Please enter a valid Email Address.");
      }

      if (discordId !== undefined) {
        const parts = discordId.split("#");
        if (
          parts.length != 2 ||
          parts[0]!.length < 1 ||
          parts[1]!.length < 1 ||
          parseInt(parts[1]!).toString() !== parts[1]
        ) {
          throw new Error("Please enter a valid Discord Id.");
        }
      }

      const succeeded = await saveAccount(
        isCreatorType ?? false,
        username,
        email,
        discordId
      );
      if (succeeded) {
        close();
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Modal
      ariaHideApp={false}
      isOpen={isShowing}
      onRequestClose={() => {
        close();
      }}
      contentLabel="Create Account"
      style={{
        overlay: { backgroundColor: "rgba(255,255,255,0.2)" },
        content: {
          inset: "0",
          position: "relative",
          backgroundColor: "rgb(15 23 42)",
          border: "1px solid rgb(204, 204, 204, 0.33)",
          borderRadius: "15px",
        },
      }}
    >
      <div className="relative mx-8">
        <form onSubmit={(e) => e.preventDefault()}>
          {isCreatorType === undefined ? (
            <>
              <h2 className="text-center">
                Welcome! Let&apos;s get you setup:
              </h2>
              <div className="flex -mt-2 justify-center items-stretch gap-5">
                <button
                  type="button"
                  className="w-full h-[250px] p-4 aspect-1 text-xl border border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-2 text-indigo-100 hover:bg-indigo-600 hover:bg-opacity-50 hover:border-indigo-200 hover:text-white"
                  onClick={() => {
                    setCreatorType(true);
                  }}
                >
                  <PaintBrushIcon className="w-8 h-8" />
                  <span>I&apos;m a Creator</span>
                  <p className="text-sm mt-2">
                    Manage your collected works, and monitor bids, sales and
                    listings across marketplaces
                  </p>
                </button>
                <button
                  type="button"
                  className="w-full h-[250px] p-4 aspect-1 text-xl border border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-2 text-indigo-100 hover:bg-indigo-600 hover:bg-opacity-50 hover:border-indigo-200 hover:text-white"
                  onClick={() => {
                    setCreatorType(false);
                  }}
                >
                  <PhotoIcon className="w-8 h-8" />
                  <span>I&apos;m a Collector</span>
                  <p className="text-sm mt-2">
                    Get notified about new work from creators I follow, and
                    manage work in my wallet
                  </p>
                </button>
              </div>
              <p className="mt-5 text-sm text-center text-indigo-400">
                Don&apos;t worry, creator accounts include all collector
                features too!
              </p>
            </>
          ) : (
            <>
              <h2 className="text-center">
                Just a couple details to finish your profile...
              </h2>
              <div className="-mt-2">
                <label>Username:</label>
                <input
                  id="username"
                  name="username"
                  className="w-full mb-3"
                  type="text"
                  placeholder="cosimo"
                  onChange={(e) => {
                    setUsername(e.target.value);
                  }}
                  value={username}
                />
              </div>
              <div className="flex justify-center items-stretch gap-5">
                <div>
                  <label>Email Address:</label>
                  <input
                    id="email"
                    name="email"
                    className="w-full mb-3"
                    type="email"
                    placeholder="mail@skulls.rip"
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    value={email}
                  />
                </div>
                <div>
                  <label>Discord ID:</label>
                  <input
                    id="discord"
                    name="discord"
                    className="w-full mb-3"
                    type="text"
                    placeholder="cosimo_rip#7028"
                    onChange={(e) => {
                      setDiscordId(e.target.value);
                    }}
                    value={discordId}
                  />
                </div>
              </div>
              <div className="text-center">
                <button
                  className="my-5 button mx-auto min-w-[200px] text-center"
                  onClick={save}
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </Modal>
  );
};

export default SignupModal;
