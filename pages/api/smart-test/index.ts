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
  res.status(200).json({
    label: "Michael Vines",
    icon: "https://lh3.googleusercontent.com/ogw/AAEL6simnCdCi2SRYaQX2iC1ZeVglkzIQy2QfwKPcjG9=s64-c-mo",
  });
});

apiRoute.post(async (req, res) => {
  res.status(200).json({
    message: "Thanks for all the fish",
    transaction:
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAECC4JMKqNplIXybGb/GhK1ofdVWeuEjXnQor7gi0Y2hMcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQECAAAMAgAAAAAAAAAAAAAA",
  });
});

export default apiRoute;
