import { ReactNode } from "react";
import { proxyImgUrl } from "utils/imgproxy";

interface Props {
  title: string;
  subtitle?: string;
  imgUrl?: string;
  right?: ReactNode;
}

const Header: React.FC<Props> = ({
  title,
  subtitle = undefined,
  imgUrl = undefined,
  right = undefined,
}) => {
  return (
    <div className="flex items-center justify-between bg-white bg-opacity-5 p-3 sm:p-4 rounded-2xl text-indigo-300">
      <div className="flex items-center gap-2 sm:gap-3">
        {imgUrl && (
          <img
            src={proxyImgUrl(imgUrl, 120, 120)}
            alt={title}
            className="rounded-2xl overflow-hidden max-h-[60px] sm:max-h-[75px] md:max-h-[120px]"
          />
        )}
        <div className="flex flex-col gap-3 w-full px-2">
          <h1 className="text-white block text-xl sm:text-2xl md:text-3xl lg:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-indigo-300">{subtitle}</p>
          )}
        </div>
      </div>
      <div>{right ?? ""}</div>
    </div>
  );
};

export default Header;
