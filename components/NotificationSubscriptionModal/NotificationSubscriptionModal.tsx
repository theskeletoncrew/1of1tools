import { XCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Modal from "react-modal";
import { shortPubKey } from "utils";

interface Props {
  prompt: string;
  isShowing: boolean;
  close: () => void;
  formfunctionNotifications: boolean;
  exchangeArtNotifications: boolean;
  dialectAddress: string | undefined;
  saveNotificationSettings: (
    formfunctionNotifications: boolean,
    exchangeArtNotifications: boolean,
    dialectAddress: string | undefined
  ) => void;
}

const NotificationSubscriptionModal: React.FC<Props> = ({
  prompt,
  isShowing,
  close,
  formfunctionNotifications,
  exchangeArtNotifications,
  dialectAddress,
  saveNotificationSettings,
}) => {
  const [ffNotifications, setFormfunctionNotifications] = useState(
    formfunctionNotifications
  );
  const [eaNotifications, setExchangeArtNotifications] = useState(
    exchangeArtNotifications
  );
  const [chosenDialectAddress, setDialectAddress] = useState(dialectAddress);

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
                  chosenDialectAddress
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
