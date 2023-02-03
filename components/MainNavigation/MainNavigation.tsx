import Link from "next/link";
import AuthenticationRow from "components/AuthenticationRow/AuthenticationRow";

interface Props {}

const MainNavigation: React.FC<Props> = ({}) => {
  return (
    <nav>
      <ul className="flex justify-between items-center text-sm">
        <li>
          <Link href="/">
            <a className="text-indigo-500">one / one</a>
          </Link>
        </li>
        <li>
          <AuthenticationRow />
          {/* <a
            href="https://discord.gg/skeletoncrewrip"
            className="text-indigo-500 text-xs"
          >
            Another SKULLISH Skeleton Crew Product
          </a> */}
        </li>
      </ul>
    </nav>
  );
};

export default MainNavigation;
