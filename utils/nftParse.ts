import { JsonMetadata } from "@metaplex-foundation/js";

export const valid3DExtensions = ["glb", "gltf", "gltf-binary"];
export const validVideoExtensions = ["mp4", "mov", "webm", "m4v", "ogv", "ogg"];
export const validAudioExtensions = ["mp3", "wav", "oga", "flac"];
export const validImageExtensions = ["jpg", "jpeg", "png", "gif"];

export const parseUriTypeFromNftJson = (
  json: JsonMetadata<string>
): { type: string; uri: string } => {
  let uri = json.image ?? "";
  let type = "image";

  if (
    json.properties &&
    json.properties.files &&
    json.properties.files.length > 0
  ) {
    for (let i = 0; i < json.properties.files.length; i++) {
      const file = json.properties.files[i];
      if (file && file.uri) {
        try {
          new URL(file.uri);
        } catch {
          // skip if not a valid url
          continue;
        }
        const parts = file.uri.split("ext=");
        const extension = parts.length > 1 ? parts[1] : null;
        if (
          file.type?.startsWith("model/") ||
          file.type?.startsWith("vr/") ||
          (extension && valid3DExtensions.includes(extension))
        ) {
          type = "model";
          uri = file.uri;
          break;
        } else if (
          file.type?.startsWith("video/") ||
          (extension && validVideoExtensions.includes(extension))
        ) {
          type = "video";
          uri = file.uri;
          break;
        } else if (
          file.type?.startsWith("audio/") ||
          (extension && validAudioExtensions.includes(extension))
        ) {
          type = "audio";
          uri = file.uri;
          break;
        } else if (
          file.type?.startsWith("image/") ||
          (extension && validImageExtensions.includes(extension))
        ) {
          type = "image";
          uri = file.uri;
          break;
        }
      }
    }
  }

  return {
    type: type,
    uri: uri,
  };
};

export const fileCategory = (file: File): string => {
  if (
    validVideoExtensions.find((f) =>
      file.name.toLowerCase().endsWith("." + f)
    ) !== undefined
  ) {
    return "video";
  } else if (
    validAudioExtensions.find((f) =>
      file.name.toLowerCase().endsWith("." + f)
    ) !== undefined
  ) {
    return "audio";
  } else if (
    valid3DExtensions.find((f) => file.name.toLowerCase().endsWith("." + f)) !==
    undefined
  ) {
    return "model";
  } else {
    return "image";
  }
};
