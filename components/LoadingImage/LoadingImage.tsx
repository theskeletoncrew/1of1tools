import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import JSXStyle from "styled-jsx/style";

export type LoadingImgProps = Omit<
  React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  >,
  "src"
> & {
  src: string;
  backupSrc?: string | null;
  loader?: JSX.Element | null;
  unloader?: JSX.Element | null;
};

const passthroughContainer = (x: any) => x;

const LoadingImage = ({
  src,
  backupSrc = null,
  loader = null,
  unloader = null,
  ...imgProps
}: LoadingImgProps): JSX.Element | null => {
  const { loadedSrc, isLoading } = useImage({ src, backupSrc });

  if (loadedSrc) return <img src={loadedSrc} {...imgProps} />;
  if (isLoading) return passthroughContainer(loader);
  if (unloader) return passthroughContainer(unloader);

  return null;
};

export const LazyLoadingImage = ({
  ...props
}: LoadingImgProps): JSX.Element | null => {
  const { inView, ref } = useInView({
    /* Optional options */
    threshold: 0,
    triggerOnce: true,
  });

  return inView ? <LoadingImage {...props} /> : <span ref={ref}></span>;
};

export type useImageProps = {
  src: string;
  backupSrc: string | null;
};

function useImage({ src, backupSrc }: useImageProps): {
  loadedSrc: string | undefined;
  isLoading: boolean;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedSrc, setLoadedSrc] = useState<string>();

  if (!src) {
    return { loadedSrc: undefined, isLoading: false };
  }

  new Promise<void>((resolve, reject) => {
    const i = new Image();
    i.onload = () => {
      i.decode ? i.decode().then(resolve).catch(reject) : resolve();
    };
    i.onerror = reject;
    i.src = src;
  })
    .then(() => {
      setIsLoading(false);
      setLoadedSrc(src);
    })
    .catch(() => {
      if (backupSrc) {
        new Promise<void>((resolve2, reject2) => {
          const i = new Image();
          i.onload = () => {
            i.decode ? i.decode().then(resolve2).catch(reject2) : resolve2();
          };
          i.onerror = reject2;
          i.src = backupSrc;
        })
          .then(() => {
            setIsLoading(false);
            setLoadedSrc(backupSrc);
          })
          .catch(() => {
            setIsLoading(false);
            setLoadedSrc(undefined);
          });
      } else {
        setIsLoading(false);
        setLoadedSrc(undefined);
      }
    });

  return { isLoading: isLoading, loadedSrc: loadedSrc };
}

export default LoadingImage;
