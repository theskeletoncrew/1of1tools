import { OneOfOneToolsClient } from "api-client";
import { getLatestBoutiqueCollectionEvents } from "db";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";

const apiRoute = nextConnect<NextApiRequest, NextApiResponse<any | Error>>({
  onError(error, req, res) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.get(async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 8;
    let error: Error;

    const eventsRes = await getLatestBoutiqueCollectionEvents(limit);
    if (eventsRes.isOk()) {
      const events = eventsRes.value;
      const mints = new Set(events.map((e) => e.mint));
      const nftsRes = await OneOfOneToolsClient.nfts([...mints]);
      if (nftsRes.isOk()) {
        res.status(200).json({
          success: true,
          events: events,
          nfts: nftsRes.value,
          paginationToken: events[events.length - 1]?.signature ?? null,
        });
        return;
      } else {
        error = nftsRes.error;
      }
    } else {
      error = eventsRes.error;
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
