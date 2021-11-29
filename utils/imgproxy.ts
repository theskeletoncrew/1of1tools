import ImageKit from "imagekit-javascript";

const IMAGEKIT_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_ENDPOINT || "";
const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "";
export const SERVER_URL =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "https://1of1.tools";

var imagekit = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: IMAGEKIT_ENDPOINT,
  authenticationEndpoint: "/imageproxy/auth",
});

export const proxyImgUrl = (
  remoteUrl: string,
  width: number,
  height: number,
  aspect: string = "fill"
): string => {
  return imagekit.url({
    path: encodeURIComponent(remoteUrl),
    transformation: [
      {
        width: width.toString(),
        height: height.toString(),
        crop: aspect == "fit" ? "at_max" : "maintain_ratio",
      },
    ],
  });
};

export const proxyDownloadImgUrl = (remoteUrl: string): string => {
  return (
    imagekit.url({
      path: encodeURIComponent(remoteUrl),
      transformation: [
        {
          original: "true",
        },
      ],
    }) + "?ik-attachment=true"
  );
};
