import { shortenedAddress } from "utils";

export const humanReadableEventType = (eventType: string) => {
  switch (eventType) {
    case "NFT_BID":
      return "Bid";
    case "NFT_BID_CANCELLED":
      return "Cancel Bid";
    case "NFT_LISTING":
      return "Listing";
    case "NFT_CANCEL_LISTING":
      return "Cancel Listing";
    case "NFT_SALE":
      return "Sale";
    case "NFT_MINT":
      return "Mint";
    case "NFT_AUCTION_CREATED":
      return "Auction Created";
    case "NFT_AUCTION_UPDATED":
      return "Auction Updated";
    case "NFT_AUCTION_CANCELLED":
      return "Auction Cancelled";
    case "NFT_PARTICIPATION_REWARD":
      return "Participation Reward";
    case "NFT_MINT_REJECTED":
      return "Mint Rejected";
    case "NFT_GLOBAL_BID":
      return "Global Bid";
    case "NFT_GLOBAL_BID_CANCELLED":
      return "Global Bid Cancelled";
    case "BURN":
      return "Burn";
    case "BURN_NFT":
      return "Burn";
    case "TRANSFER":
      return "Transfer";
    case "STAKE_TOKEN":
      return "Stake";
    case "UNSTAKE_TOKEN":
      return "Unstake";
  }
  return eventType;
};

export const humanReadableSource = (source: string) => {
  switch (source) {
    case "CANDY_MACHINE_V1":
      return "Candy Machine (V1)";
    case "CANDY_MACHINE_V2":
      return "Candy Machine (V2)";
    case "CANDY_MACHINE_V3":
      return "Candy Machine (V3)";
    case "FORM_FUNCTION":
      return "Formfunction";
    case "EXCHANGE_ART":
      return "Exchange Art";
    case "MAGIC_EDEN":
      return "Magic Eden";
    case "SOLANART":
      return "Solanart";
    case "HYPERSPACE":
      return "Hyperspace";
    case "SOLSEA":
      return "SolSea";
    case "YAWWW":
      return "Yawww";
    case "DIGITAL_EYES":
      return "Digital Eyes";
    case "TENSOR":
      return "Tensor";
    case "METAPLEX":
      return "Metaplex";
    case "SOLANA_PROGRAM_LIBRARY":
      return "Solana Program Library";
    case "SYSTEM_PROGRAM":
      return "System Program";
  }
  return source;
};

export const humanReadableSourceSm = (source: string) => {
  switch (source) {
    case "CANDY_MACHINE_V1":
      return "CM1";
    case "CANDY_MACHINE_V2":
      return "CM2";
    case "CANDY_MACHINE_V3":
      return "CM3";
    case "FORM_FUNCTION":
      return "FF";
    case "EXCHANGE_ART":
      return "EA";
    case "MAGIC_EDEN":
      return "ME";
    case "SOLANART":
      return "SLA";
    case "HYPERSPACE":
      return "HYP";
    case "SOLSEA":
      return "SS";
    case "YAWWW":
      return "YAW";
    case "DIGITAL_EYES":
      return "DE";
    case "TENSOR":
      return "TEN";
    case "METAPLEX":
      return "MPL";
    case "SOLANA_PROGRAM_LIBRARY":
      return "SPL";
    case "SYSTEM_PROGRAM":
      return "SYS";
  }
  return source;
};

export const humanReadableEventPastTense = (eventType: string) => {
  switch (eventType) {
    case "NFT_BID":
      return "New bid";
    case "NFT_BID_CANCELLED":
      return "Cancelled bid";
    case "NFT_LISTING":
      return "New listing";
    case "NFT_CANCEL_LISTING":
      return "Cancelled listing";
    case "NFT_SALE":
      return "New sale";
    case "NFT_MINT":
      return "New mint";
    case "NFT_AUCTION_CREATED":
      return "New auction";
    case "NFT_AUCTION_UPDATED":
      return "Updated auction";
    case "NFT_AUCTION_CANCELLED":
      return "Cancelled auction";
    case "BURN":
      return "NFT Burned";
    case "BURN_NFT":
      return "NFT Burned";
    case "TRANSFER":
      return "NFT transferred";
    case "STAKE_TOKEN":
      return "NFT staked";
    case "UNSTAKE_TOKEN":
      return "NFT unstaked";
  }
  return eventType;
};

export const urlForSource = (
  source: string,
  nftAddress: string
): string | null => {
  switch (source) {
    case "FORM_FUNCTION":
      return `https://formfunction.xyz/@1of1tools/${nftAddress}`;
    case "EXCHANGE_ART":
      return `https://exchange.art/single/${nftAddress}`;
    default:
      return null;
  }
};

export const humanReadableTransaction = (transaction: any): string => {
  const source = transaction.source;
  const type = transaction.type;
  const nft =
    transaction.events.nft?.nfts?.length > 0
      ? transaction.events.nft?.nfts[0]
      : null;
  const url = urlForSource(source, nft.mint);
  return `${humanReadableEventPastTense(
    transaction.type
  )} on ${humanReadableSource(source)}${url ? ": " + url : ""}`;
};
