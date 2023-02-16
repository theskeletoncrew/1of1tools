import { APIEmbedField, EmbedBuilder } from "discord.js";
import { EnrichedTransaction } from "models/enrichedTransaction";
import { OneOfOneNFTMetadata } from "models/oneOfOneNFTMetadata";
import { shortenedAddress, shortPubKey } from "utils";
import {
  humanReadableEventPastTense,
  humanReadableSource,
  urlForSource,
} from "./helius";

export const discordEmbedForTransaction = (
  transaction: EnrichedTransaction,
  metadata: OneOfOneNFTMetadata | null
): EmbedBuilder => {
  const nftEvent = transaction.events.nft;
  const nft = nftEvent?.nfts?.length > 0 ? nftEvent?.nfts[0] : null;

  const source = transaction.source;
  const url = nft ? urlForSource(source, nft.mint) : null;

  const typeText = humanReadableEventPastTense(transaction.type);
  const sellerURL = `https://1of1.tools/wallet/${nftEvent.seller}`;
  const buyerURL = `https://1of1.tools/wallet/${nftEvent.buyer}`;
  const sellerText = nftEvent?.seller
    ? ` by [${shortenedAddress(nftEvent.seller)}](${sellerURL})`
    : "";
  const buyerRelationship = nftEvent.seller ? "to" : "by";
  const buyerText = nftEvent?.buyer
    ? ` ${buyerRelationship} [${shortenedAddress(nftEvent.buyer)}](${buyerURL})`
    : "";
  const sourceText = url
    ? ` on [${humanReadableSource(source)}](${url})`
    : ` on ${humanReadableSource(source)}`;

  const description = `${typeText}${sellerText}${buyerText}${sourceText}`;

  let fields: APIEmbedField[] = [];

  const embed = new EmbedBuilder()
    .setColor(0x3730a3)
    .setURL(url)
    .setDescription(description)
    .setAuthor({
      name: shortPubKey(transaction.signature),
      url: `https://solscan.io/tx/${transaction.signature}`,
    })
    .setTimestamp(transaction.timestamp * 1000)
    .setFooter({
      text: "Powered by 1of1.tools",
    });
  if (metadata) {
    embed.setTitle(metadata.name).setThumbnail(metadata.cachedImage);
    // .setImage()

    if (metadata.description) {
      fields.push({
        name: "Description",
        value: metadata.description,
      });
    }

    // const nftAttributes: { [key: string]: string } = {
    //   "ATTRIB 1": "Coming Soon",
    //   "ATTRIB 2": "Coming Soon",
    // };

    // Object.keys(nftAttributes).forEach((key) => {
    //   fields.push({
    //     name: key,
    //     value: nftAttributes[key]!,
    //     inline: true,
    //   });
    // });
  } else if (nft) {
    embed.setTitle(nft.name ? nft.name : shortenedAddress(nft.mint));
  } else {
    embed.setTitle("Unknown");
  }
  embed.addFields(fields);
  return embed;
};
