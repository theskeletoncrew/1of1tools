import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { randomBytes, secretbox } from "tweetnacl";
import { firebaseAdmin } from "utils/firebase";
import { getFirestore } from "firebase-admin/firestore";

const newNonce = () => randomBytes(secretbox.nonceLength);

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
    // get pubkey form req
    const publicKey = req.query.publicKey?.toString();

    if (publicKey) {
      // generate an updated nonce
      let nonce = newNonce().toString();
      let ttl = +new Date() + 300000;

      const db = getFirestore(firebaseAdmin);
      const docRef = db.doc(`signinattempts/${publicKey}`);
      await docRef.set({ publicKey, nonce, ttl });

      res.status(200).json({ nonce });
    } else {
      res.status(400).json("No public key specified");
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
