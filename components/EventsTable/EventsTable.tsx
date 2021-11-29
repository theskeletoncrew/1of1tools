import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { NFTEvent } from "models/nftEvent";
import { classNames, shortenedAddress, txUrl } from "utils";
import { network } from "utils/network";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  humanReadableEventType,
  humanReadableSource,
  humanReadableSourceSm,
} from "utils/helius";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(dayjs.tz.guess());

interface Props {
  events: NFTEvent[];
}

const EventsTable: React.FC<Props> = ({ events }) => {
  return events && events.length > 0 ? (
    <>
      <h2 className="text-xl mt-8 px-1">Events:</h2>
      <div className="mt-4 inline-block min-w-full align-middle">
        <div className="shadow-sm ring-1 ring-black ring-opacity-5">
          <table
            className="min-w-full border-separate text-left text-xs md:text-sm"
            style={{ borderSpacing: 0 }}
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky top-0 z-10 border-b border-indigo-900 bg-white bg-opacity-5 px-1 sm:px-2 py-3.5 text-left font-semibold text-slate-400 backdrop-blur backdrop-filter"
                >
                  <span className="hidden sm:block">Transaction</span>
                  <span className="block sm:hidden" title="Transaction">
                    Tx
                  </span>
                </th>
                <th
                  scope="col"
                  className="sticky top-0 z-10 border-b border-indigo-900 bg-white bg-opacity-5 px-1 sm:px-2 py-3.5 text-left font-semibold text-slate-400 backdrop-blur backdrop-filter"
                >
                  <span className="hidden sm:block">Event</span>
                  <span className="block sm:hidden" title="Event">
                    Evt
                  </span>
                </th>
                <th
                  scope="col"
                  className="sticky top-0 z-10 border-b border-indigo-900 bg-white bg-opacity-5 px-1 sm:px-2 py-3.5 text-left font-semibold text-slate-400 backdrop-blur backdrop-filter"
                >
                  Buyer
                </th>
                <th
                  scope="col"
                  className="sticky top-0 z-10 border-b border-indigo-900 bg-white bg-opacity-5 px-1 sm:px-2 py-3.5 text-left font-semibold text-slate-400 backdrop-blur backdrop-filter"
                >
                  <span className="hidden sm:block">Amount</span>
                  <span className="block sm:hidden" title="Amount (SOL)">
                    Amt
                  </span>
                </th>
                <th
                  scope="col"
                  className="sticky top-0 z-10 border-b border-indigo-900 bg-white bg-opacity-5 px-1 sm:px-2 py-3.5 text-left font-semibold text-slate-400 backdrop-blur backdrop-filter"
                >
                  Seller
                </th>
                <th
                  scope="col"
                  className="sticky top-0 z-10 border-b border-indigo-900 bg-white bg-opacity-5 px-1 sm:px-2 py-3.5 text-left font-semibold text-slate-400 backdrop-blur backdrop-filter"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="sticky top-0 z-10 border-b border-indigo-900 bg-white bg-opacity-5 px-1 sm:px-2 py-3.5 text-left font-semibold text-slate-400 backdrop-blur backdrop-filter"
                >
                  <span className="hidden sm:block">Source</span>
                  <span className="block sm:hidden" title="Source">
                    Src
                  </span>
                </th>
                <th
                  scope="col"
                  className="sticky top-0 z-10 border-b border-indigo-900 bg-white bg-opacity-5 px-1 sm:px-2 py-3.5 text-left font-semibold text-slate-400 backdrop-blur backdrop-filter"
                ></th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => (
                <tr
                  key={event.signature}
                  className={classNames(
                    "bg-opacity-25 hover:bg-opacity-50",
                    i % 2 == 0 ? "bg-indigo-800" : "bg-indigo-700"
                  )}
                >
                  <td className="whitespace-nowrap px-1 sm:px-2 py-4 text-slate-400 border-slate-700 border-opacity-75">
                    <a href={txUrl(event.signature, network)}>
                      <span className="hidden sm:block">
                        {shortenedAddress(event.signature)}
                      </span>
                      <span className="block sm:hidden">
                        {shortenedAddress(event.signature, true)}
                      </span>
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-1 sm:px-2 py-4 text-slate-400 border-slate-700 border-opacity-75">
                    {humanReadableEventType(event.type)}
                  </td>
                  <td className="whitespace-nowrap px-1 sm:px-2 py-4 text-slate-400 border-slate-700 border-opacity-75">
                    {event.buyer && (
                      <a href={`/wallet/${event.buyer}`}>
                        <span className="hidden sm:block">
                          {shortenedAddress(event.buyer)}
                        </span>
                        <span className="block sm:hidden">
                          {shortenedAddress(event.buyer, true)}
                        </span>
                      </a>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-1 sm:px-2 py-4 text-slate-400 border-slate-700 border-opacity-75">
                    <span className="hidden sm:block">
                      {event.amount / LAMPORTS_PER_SOL} SOL
                    </span>
                    <span className="block sm:hidden">
                      {event.amount / LAMPORTS_PER_SOL}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-1 sm:px-2 py-4 text-slate-400 border-slate-700 border-opacity-75">
                    {event.seller && (
                      <a href={`/wallet/${event.seller}`}>
                        <span className="hidden sm:block">
                          {shortenedAddress(event.seller)}
                        </span>
                        <span className="block sm:hidden">
                          {shortenedAddress(event.seller, true)}
                        </span>
                      </a>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-1 sm:px-2 py-4 text-slate-400 border-slate-700 border-opacity-75 ">
                    <span
                      title={dayjs
                        .utc(event.timestamp * 1000)
                        .tz()
                        .format("MMM D, YYYY h:mm A")}
                    >
                      {dayjs(event.timestamp * 1000).toNow(true)} ago
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-1 sm:px-2 py-4 text-slate-400 border-slate-700 border-opacity-75 ">
                    {event.source === "EXCHANGE_ART" &&
                    (event.nfts ?? []).length > 0 ? (
                      <a
                        href={`https://exchange.art/single/${
                          event.nfts[0]!.mint
                        }`}
                      >
                        <span className="hidden sm:block">
                          {humanReadableSource(event.source)}
                        </span>
                        <span className="block sm:hidden">
                          {humanReadableSourceSm(event.source)}
                        </span>
                      </a>
                    ) : (
                      <>
                        <span className="hidden sm:block">
                          {humanReadableSource(event.source)}
                        </span>
                        <span className="block sm:hidden">
                          {humanReadableSourceSm(event.source)}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-1 sm:px-2 py-4 text-slate-400 border-slate-700 border-opacity-75 ">
                    <span
                      aria-label={event.description}
                      data-microtip-position="top-left"
                      data-microtip-size="fit"
                      role="tooltip"
                    >
                      <span className="hidden sm:block">
                        <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400 cursor-pointer" />
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    <></>
  );
};

export default EventsTable;
