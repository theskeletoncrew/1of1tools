import { APIEmbedField, EmbedBuilder, RestOrArray } from "discord.js";
import { EnrichedTransaction } from "models/enrichedTransaction";
import { shortenedAddress, shortPubKey } from "utils";
import {
  humanReadableEventPastTense,
  humanReadableSource,
  urlForSource,
} from "./helius";

export const discordEmbedForTransaction = (
  transaction: EnrichedTransaction
): EmbedBuilder => {
  const source = transaction.source;
  const type = transaction.type;
  const nftEvent = transaction.events.nft;
  const nft = nftEvent?.nfts?.length > 0 ? nftEvent?.nfts[0] : null;
  const url = nft ? urlForSource(source, nft.mint) : null;
  const title = !nft
    ? "Unknown"
    : nft.name
    ? nft.name
    : shortenedAddress(nft.mint);
  const description = `${humanReadableEventPastTense(
    transaction.type
  )} on ${humanReadableSource(source)}${url ? ": " + url : ""}`;

  let fields: RestOrArray<APIEmbedField> = [];

  if (nft?.mint) {
    fields.push({ name: "Mint", value: nft.mint });
  }

  fields.push({
    name: "Source",
    value: humanReadableSource(source),
    inline: true,
  });

  if (nftEvent?.buyer) {
    fields.push({
      name: "Buyer",
      value: shortPubKey(nftEvent.buyer),
      inline: true,
    });
  }

  if (nftEvent?.seller) {
    fields.push({
      name: "Seller",
      value: shortPubKey(nftEvent.seller),
      inline: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x3730a3)
    .setTitle(title)
    .setURL(url)
    .setAuthor({
      name: shortPubKey(transaction.signature),
      url: `https://solscan.io/tx/${transaction.signature}`,
    })
    .setDescription(description)
    // .setThumbnail("")
    .addFields(fields)
    // .setImage()
    .setTimestamp(transaction.timestamp * 1000)
    .setFooter({
      text: "Powered by 1of1.tools",
    });
  return embed;
};
