# 1of1.tools

1of1.tools is aimed to be a high performance NFT explorer and tool suite, serving the 1/1 creator and collector community. Users can search & browse NFTs by mint address / hashlist, creator address, owner wallet address, and collection address. In addition to Solana public keys, search supports both bonafida .sol addresses and twitter handles where available.

https://1of1.tools

Creators can sign in to take actions on NFTs they are the update authority on, including editing an NFT (update media and metadata fields), or mint a brand new NFT.

Collectors can sign in to take actions on NFTs they own, like sending NFTs, burning NFTs, and download original images.

#### Helius:
1of1.tools leverages Helius for high performance browsing of NFT data and events, and triggers for monitoring NFT auctions/listings/bids/sales across multiple marketplaces via webhooks.

#### Crossmint:
When minting a new NFT, 1of1tools uses Crossmint to offer the option to mint and send an NFT to an email address. This could be a great way to deliver an NFT to someone who does not yet have a wallet, or who's wallet address is unknown to you.

#### Dialect:
Users can monitor Exchange Art and Formfunction events for NFTs or Creators that they are interested. Events are delivered to the user in the Dialect mobile app (in private beta) in realtime.

#### Architecture:
The site runs on Next.js, with a Firebase backend, and serves web3 images via a passthrough cache by utilizing Imagekit.io. Wallet authentication leverages a Solana integration with NextAuth.js.

## Feedback, Contributing, and Feature Requests

Please reach out! The project is maintained by the [Skeleton Crew](https://discord.gg/skeletoncrewrip), w/technical direction by founder [@cosimo_rip](https://twitter.com/cosimo_rip).  


## Running the Code

Copy .env to .env.local and provide all relevant API keys and credentials  

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
