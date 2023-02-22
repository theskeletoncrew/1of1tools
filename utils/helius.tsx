import { EnrichedTransaction } from "models/enrichedTransaction";
import { Source, TransactionType } from "helius-sdk";
import { OneOfOneNFTEvent } from "models/nftEvent";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const humanReadableEventType = (eventType: string) => {
  switch (eventType) {
    case TransactionType.NFT_BID:
      return "Bid";
    case TransactionType.NFT_BID_CANCELLED:
      return "Cancel Bid";
    case TransactionType.NFT_LISTING:
      return "Listing";
    case TransactionType.NFT_CANCEL_LISTING:
      return "Cancel Listing";
    case TransactionType.NFT_SALE:
      return "Sale";
    case TransactionType.NFT_MINT:
      return "Mint";
    case TransactionType.NFT_AUCTION_CREATED:
      return "Auction Created";
    case TransactionType.NFT_AUCTION_UPDATED:
      return "Auction Updated";
    case TransactionType.NFT_AUCTION_CANCELLED:
      return "Auction Cancelled";
    case TransactionType.NFT_PARTICIPATION_REWARD:
      return "Participation Reward";
    case TransactionType.NFT_MINT_REJECTED:
      return "Mint Rejected";
    case TransactionType.NFT_GLOBAL_BID:
      return "Global Bid";
    case TransactionType.NFT_GLOBAL_BID_CANCELLED:
      return "Global Bid Cancelled";
    case TransactionType.BURN:
      return "Burn";
    case TransactionType.BURN_NFT:
      return "Burn";
    case TransactionType.TRANSFER:
      return "Transfer";
    case TransactionType.STAKE_TOKEN:
      return "Stake";
    case TransactionType.UNSTAKE_TOKEN:
      return "Unstake";
  }
  return eventType;
};

export const humanReadableSource = (source: string) => {
  switch (source) {
    case Source.CANDY_MACHINE_V1:
      return "Candy Machine (V1)";
    case Source.CANDY_MACHINE_V2:
      return "Candy Machine (V2)";
    case Source.CANDY_MACHINE_V3:
      return "Candy Machine (V3)";
    case Source.FORM_FUNCTION:
      return "Formfunction";
    case Source.EXCHANGE_ART:
      return "Exchange Art";
    case Source.MAGIC_EDEN:
      return "Magic Eden";
    case Source.SOLANART:
      return "Solanart";
    case Source.HYPERSPACE:
      return "Hyperspace";
    case Source.SOLSEA:
      return "SolSea";
    case Source.YAWWW:
      return "Yawww";
    case Source.DIGITAL_EYES:
      return "Digital Eyes";
    case Source.TENSOR:
      return "Tensor";
    case Source.METAPLEX:
      return "Metaplex";
    case Source.SOLANA_PROGRAM_LIBRARY:
      return "Solana Program Library";
    case Source.SYSTEM_PROGRAM:
      return "System Program";
  }
  return source;
};

export const humanReadableSourceSm = (source: string) => {
  switch (source) {
    case Source.CANDY_MACHINE_V1:
      return "CM1";
    case Source.CANDY_MACHINE_V2:
      return "CM2";
    case Source.CANDY_MACHINE_V3:
      return "CM3";
    case Source.FORM_FUNCTION:
      return "FF";
    case Source.EXCHANGE_ART:
      return "EA";
    case Source.MAGIC_EDEN:
      return "ME";
    case Source.SOLANART:
      return "SLA";
    case Source.HYPERSPACE:
      return "HYP";
    case Source.SOLSEA:
      return "SS";
    case Source.YAWWW:
      return "YAW";
    case Source.DIGITAL_EYES:
      return "DE";
    case Source.TENSOR:
      return "TEN";
    case Source.METAPLEX:
      return "MPL";
    case Source.SOLANA_PROGRAM_LIBRARY:
      return "SPL";
    case Source.SYSTEM_PROGRAM:
      return "SYS";
  }
  return source;
};

export const humanReadableEventPastTense = (eventType: string) => {
  switch (eventType) {
    case TransactionType.NFT_BID:
      return "New bid";
    case TransactionType.NFT_BID_CANCELLED:
      return "Cancelled bid";
    case TransactionType.NFT_LISTING:
      return "New listing";
    case TransactionType.NFT_CANCEL_LISTING:
      return "Cancelled listing";
    case TransactionType.NFT_SALE:
      return "New sale";
    case TransactionType.NFT_MINT:
      return "New mint";
    case TransactionType.NFT_AUCTION_CREATED:
      return "New auction";
    case TransactionType.NFT_AUCTION_UPDATED:
      return "Updated auction";
    case TransactionType.NFT_AUCTION_CANCELLED:
      return "Cancelled auction";
    case TransactionType.BURN:
      return "NFT burned";
    case TransactionType.BURN_NFT:
      return "NFT burned";
    case TransactionType.TRANSFER:
      return "NFT transferred";
    case TransactionType.STAKE_TOKEN:
      return "NFT staked";
    case TransactionType.UNSTAKE_TOKEN:
      return "NFT unstaked";
  }
  return eventType;
};

export const urlForSource = (
  source: string,
  nftAddress: string
): string | null => {
  switch (source) {
    case Source.FORM_FUNCTION:
      // not predictable, but resolves if using a fake username
      return `https://formfunction.xyz/@1of1tools/${nftAddress}`;
    case Source.EXCHANGE_ART:
      return `https://exchange.art/single/${nftAddress}`;
    case Source.MAGIC_EDEN:
      return `https://magiceden.io/item-details/${nftAddress}`;
    case Source.SOLANART:
      return `https://solanart.io/nft/${nftAddress}`;
    case Source.HYPERSPACE:
      return `https://hyperspace.xyz/token/${nftAddress}`;
    case Source.SOLSEA:
      return `https://solsea.io/n/${nftAddress}`;
    case Source.OPENSEA:
      return `https://opensea.io/assets/solana/${nftAddress}`;
    case Source.YAWWW:
      return null; // not predictable (uses a different id for each listing)
    case Source.DIGITAL_EYES:
      return null; // not predictable format
    case Source.TENSOR:
      return `https://www.tensor.trade/item/${nftAddress}`;
    default:
      return null;
  }
};

export const humanReadableTransaction = (
  transaction: EnrichedTransaction,
  useFirstPartyUrls: boolean = true
): string => {
  const source = transaction.source;
  const type = transaction.type;
  const nft =
    transaction.events.nft?.nfts?.length > 0
      ? transaction.events.nft?.nfts[0]
      : null;
  const url = useFirstPartyUrls
    ? `https://1of1.tools/tx/${transaction.signature}?i=1`
    : nft
    ? urlForSource(source, nft.mint)
    : null;
  const description = `${humanReadableEventPastTense(
    transaction.type
  )} on ${humanReadableSource(source)}${url ? ": " + url : ""}`;
  return description;
};

export const humanReadableEventShort = (
  event: OneOfOneNFTEvent,
  denominationString: string | null = null
): JSX.Element => {
  const source = event.source;
  const type = event.type;
  const nft = event.mint;
  const url = nft ? urlForSource(source, event.mint) : null;
  const showAmount =
    isEventTypeAmountDisplayable(event.type as TransactionType) &&
    event.amount > 0;
  const description = (
    <span>
      {humanReadableEventPastTense(event.type)}:{" "}
      {showAmount ? (
        <span className="whitespace-nowrap inline-flex items-center">
          <span>{event.amount / LAMPORTS_PER_SOL}</span>
          {denominationString ? (
            denominationString
          ) : (
            <span className="inline-block" style={{ paddingLeft: "1px" }}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <use href="#solana-icon"></use>
              </svg>
            </span>
          )}
        </span>
      ) : (
        ""
      )}
    </span>
  );
  return description;
};

export const isEventTypeAmountDisplayable = (
  type: TransactionType
): boolean => {
  return [
    TransactionType.NFT_BID,
    TransactionType.NFT_LISTING,
    TransactionType.NFT_SALE,
    TransactionType.NFT_MINT,
    TransactionType.NFT_AUCTION_CREATED,
    TransactionType.NFT_AUCTION_UPDATED,
    TransactionType.NFT_PARTICIPATION_REWARD,
    TransactionType.NFT_GLOBAL_BID,
  ].includes(type);
};
