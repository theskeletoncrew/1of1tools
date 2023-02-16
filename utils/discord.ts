import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { APIEmbedField, EmbedBuilder } from "discord.js";
import { TransactionType } from "helius-sdk";
import { EnrichedTransaction } from "models/enrichedTransaction";
import { OneOfOneNFTMetadata } from "models/oneOfOneNFTMetadata";
import { shortenedAddress, shortPubKey } from "utils";
import {
  humanReadableEventPastTense,
  humanReadableSource,
  urlForSource,
} from "./helius";
import { loadBonfidaName, loadTwitterName } from "utils/addressResolution";

export const discordEmbedForTransaction = async (
  transaction: EnrichedTransaction,
  metadata: OneOfOneNFTMetadata | null
): Promise<EmbedBuilder> => {
  const nftEvent = transaction.events.nft;
  const nft = nftEvent.nfts?.length > 0 ? nftEvent.nfts[0] : null;

  const source = transaction.source;
  const url = `https://1of1.tools/nft/${nft?.mint}?i=1`;
  const sourceURL = nft ? urlForSource(source, nft.mint) : null;

  const typeText = humanReadableEventPastTense(transaction.type);

  let sellerText: string | null = null;
  let buyerText: string | null = null;

  if (nftEvent.seller) {
    let sellerURL = nftEvent?.seller
      ? `https://1of1.tools/wallet/${nftEvent.seller}`
      : null;
    let sellerName = shortenedAddress(nftEvent.seller);
    let sellerPt2: string = "";

    const sellerTwitter = await loadTwitterName(nftEvent.seller);
    if (sellerTwitter) {
      sellerPt2 = `[${sellerName}](${sellerURL})`;
      sellerName = sellerTwitter;
      sellerURL = `https://twitter.com/${sellerTwitter}`;
    } else {
      const sellerBonafida = await loadBonfidaName(nftEvent.seller);
      if (sellerBonafida) {
        sellerName = sellerBonafida + ".sol";
      }
    }

    sellerText = ` by [${sellerName}](${sellerURL})${sellerPt2}`;
  }

  if (nftEvent.buyer) {
    let buyerURL = nftEvent?.buyer
      ? `https://1of1.tools/wallet/${nftEvent.buyer}`
      : null;
    let buyerName = shortenedAddress(nftEvent.buyer);
    let buyerPt2: string = "";

    const buyerTwitter = await loadTwitterName(nftEvent.buyer);
    if (buyerTwitter) {
      buyerPt2 = `[${buyerName}](${buyerURL})`;
      buyerName = buyerTwitter;
      buyerURL = `https://twitter.com/${buyerTwitter}`;
    } else {
      const buyerBonafida = await loadBonfidaName(nftEvent.buyer);
      if (buyerBonafida) {
        buyerName = buyerBonafida;
      }
    }

    const buyerRelationship = nftEvent.seller ? "to" : "by";
    buyerText = ` ${buyerRelationship} [${buyerName}](${buyerURL})${buyerPt2}`;
  }

  const priceText =
    transaction.type === TransactionType.NFT_BID ||
    transaction.type === TransactionType.NFT_SALE
      ? ` for ${nftEvent.amount / LAMPORTS_PER_SOL} SOL`
      : "";
  const sourceText = sourceURL
    ? ` on [${humanReadableSource(source)}](${sourceURL})`
    : ` on ${humanReadableSource(source)}`;

  const description = `${typeText}${sellerText}${buyerText}${priceText}${sourceText}`;

  let fields: APIEmbedField[] = [];

  const embed = new EmbedBuilder()
    .setColor(0x3730a3)
    .setURL(url)
    .setDescription(description)
    .setAuthor({
      name: `Tx: ${shortPubKey(transaction.signature)}`,
      url: `https://solscan.io/tx/${transaction.signature}`,
    })
    .setTimestamp(transaction.timestamp * 1000)
    .setFooter({
      text: "Powered by 1of1.tools",
    });
  if (metadata) {
    embed
      .setTitle(`${typeText.toUpperCase()} - ${metadata.name}`)
      .setImage(metadata.cachedImage ?? metadata.image);

    if (metadata.description) {
      fields.push({
        name: "Description",
        value:
          metadata.description.length > 150
            ? metadata.description.substring(0, 150) + "..."
            : metadata.description,
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
    embed.setTitle(
      `${typeText.toUpperCase()} - ${
        nft.name ? nft.name : shortenedAddress(nft.mint)
      }`
    );
  } else {
    embed.setTitle(`${typeText.toUpperCase()} - Unknown`);
  }
  embed.addFields(fields);
  return embed;
};
