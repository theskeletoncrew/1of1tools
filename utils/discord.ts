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

  // Change this to nft name
  const title = !nft
    ? "Unknown"
    : nft.name
    ? nft.name
    : shortenedAddress(nft.mint);

  const typeText = humanReadableEventPastTense(transaction.type);
  const sellerURL = `https://1of1.tools/wallet/${nftEvent.seller}`;
  const buyerURL = `https://1of1.tools/wallet/${nftEvent.buyer}`;
  const sellerText = nftEvent?.seller
    ? ` by [${nftEvent.seller}](${sellerURL})`
    : "";
  const buyerText = nftEvent?.buyer
    ? ` to [${nftEvent.buyer}](${buyerURL})`
    : "";
  const sourceText = url
    ? `on [${humanReadableSource(source)}](url)`
    : `on ${humanReadableSource(source)}`;

  const description = `${typeText}${sellerText}${buyerText}${sourceText}`;

  const nftName = "NFT Name Coming Soon";
  const nftDescription = "NFT Description Coming Soon";

  let fields: APIEmbedField[] = [];

  const nftAttributes: { [key: string]: string } = {
    "ATTRIBUTE 1": "COMING SOON",
    "ATTRIBUTE 2": "COMING SOON",
  };

  Object.keys(nftAttributes).forEach((key) => {
    fields.push({
      name: key,
      value: nftAttributes[key]!,
      inline: true,
    });
  });

  fields.push({
    name: "Description",
    value: nftDescription,
  });

  const embed = new EmbedBuilder()
    .setColor(0x3730a3)
    .setTitle(nftName)
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
