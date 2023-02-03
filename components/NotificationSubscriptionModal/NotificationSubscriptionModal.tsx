import { ChevronDownIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { DiscordGuild, DiscordGuildChannelIdPair } from "models/account";
import { Fragment, useState } from "react";
import Modal from "react-modal";
import { Popover, Transition } from "@headlessui/react";

interface Props {
  prompt: string;
  isShowing: boolean;
  close: () => void;
  formfunctionNotifications: boolean;
  exchangeArtNotifications: boolean;
  dialectAddress: string | undefined;
  discordGuilds?: DiscordGuild[] | undefined;
  discordSubscriptions?: DiscordGuildChannelIdPair[];
  saveNotificationSettings: (
    formfunctionNotifications: boolean,
    exchangeArtNotifications: boolean,
    dialectAddress: string | undefined,
    discordSubscriptions: DiscordGuildChannelIdPair[] | undefined
  ) => void;
}

const NotificationSubscriptionModal: React.FC<Props> = ({
  prompt,
  isShowing,
  close,
  formfunctionNotifications,
  exchangeArtNotifications,
  dialectAddress,
  discordGuilds,
  discordSubscriptions = [],
  saveNotificationSettings,
}) => {
  const [ffNotifications, setFormfunctionNotifications] = useState(
    formfunctionNotifications
  );
  const [eaNotifications, setExchangeArtNotifications] = useState(
    exchangeArtNotifications
  );
  const [chosenDialectAddress, setDialectAddress] = useState(dialectAddress);
  const [chosenDiscordSubscriptions, setDiscordSubscriptions] =
    useState(discordSubscriptions);

  const updateDiscordSubscription = (
    guildId: string,
    channelId: string,
    isSelected: boolean
  ) => {
    setDiscordSubscriptions((subscriptions) => {
      let subs = [...subscriptions] ?? [];
      const index = subs?.findIndex((s) => s.guildId === guildId);
      if (!isSelected) {
        if (index !== -1) {
          subs.splice(index, 1);
        }
      } else if (index === -1) {
        subs.push({
          guildId: guildId,
          channelId: channelId,
        });
      }
      return subs;
    });
  };

  return (
    <Modal
      ariaHideApp={false}
      isOpen={isShowing}
      onRequestClose={close}
      contentLabel="Notifications"
      style={{
        overlay: { backgroundColor: "rgba(255,255,255,0.2)" },
        content: {
          inset: "0",
          position: "relative",
          backgroundColor: "rgb(15 23 42)",
          border: "1px solid rgb(204, 204, 204, 0.33)",
          borderRadius: "8px",
          overflow: "inherit",
        },
      }}
    >
      <div className="relative">
        <h2>Dialect App Notifications</h2>
        <button
          className="p-2 absolute right-[-15px] top-[-15px]"
          onClick={close}
        >
          <span title="Delete">
            <XCircleIcon className="w-5 h-5" />
          </span>
        </button>
        <p>{prompt}</p>
        <form onSubmit={(e) => e.preventDefault()} className="mt-6">
          <div className="flex gap-2">
            <input
              type="checkbox"
              id="formfunction"
              name="formfunction"
              defaultChecked={formfunctionNotifications}
              onChange={(e) => {
                setFormfunctionNotifications(e.currentTarget.checked);
              }}
            />
            <label htmlFor="formfunction">Formfunction</label>
          </div>
          <div className="flex gap-2 mt-1">
            <input
              type="checkbox"
              id="exchangeart"
              name="exchangeart"
              defaultChecked={exchangeArtNotifications}
              onChange={(e) => {
                setExchangeArtNotifications(e.currentTarget.checked);
              }}
            />
            <label htmlFor="exchangeart">Exchange Art</label>
          </div>
          <div className="flex flex-col gap-2 mt-5">
            <label htmlFor="exchangeart">
              Dialect Address (ex from the Dialect mobile app)
            </label>
            <input
              type="text"
              id="dialect"
              name="dialect"
              defaultValue={dialectAddress}
              onChange={(e) => {
                setDialectAddress(e.currentTarget.value);
              }}
            />
          </div>
          {discordGuilds && discordGuilds.length > 0 && (
            <div className="mt-4">
              <Popover as="div" className="relative inline-block text-left">
                <div>
                  <Popover.Button className="group inline-flex items-center justify-center">
                    <span>Discord Server Subscriptions</span>
                    <span className="ml-1.5 rounded bg-gray-200 py-0.5 px-1.5 text-xs font-semibold tabular-nums text-gray-700">
                      {chosenDiscordSubscriptions?.length ?? 0}
                    </span>
                    <ChevronDownIcon
                      className="-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                  </Popover.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Popover.Panel className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white p-4 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none max-w-[350px]">
                    <form className="space-y-4">
                      {discordGuilds.map((guild) => (
                        <div key={guild.id} className="flex items-center">
                          <input
                            id={`${guild.id}`}
                            name={`${guild.id}[]`}
                            value={`${guild.id}-${guild.selectedChannelId}`}
                            type="checkbox"
                            defaultChecked={
                              chosenDiscordSubscriptions?.find(
                                (s) => s.guildId === guild.id
                              ) !== undefined
                            }
                            onChange={(e) =>
                              updateDiscordSubscription(
                                guild.id,
                                guild.selectedChannelId!,
                                e.currentTarget.checked
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor={`${guild.id}`}
                            className="ml-3 cursor-pointer truncate whitespace-nowrap pr-6 text-sm font-medium text-gray-900"
                          >
                            {guild.name}
                          </label>
                        </div>
                      ))}
                    </form>
                  </Popover.Panel>
                </Transition>
              </Popover>
            </div>
          )}
          <div className="buttons">
            <button
              type="button"
              className="button cancelButton"
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button"
              onClick={async () => {
                saveNotificationSettings(
                  ffNotifications,
                  eaNotifications,
                  chosenDialectAddress,
                  chosenDiscordSubscriptions
                );
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default NotificationSubscriptionModal;
