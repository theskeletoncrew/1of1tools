import Link from "next/link";
import AuthenticationRow from "components/AuthenticationRow/AuthenticationRow";

interface Props {}

const MainNavigation: React.FC<Props> = ({}) => {
  return (
    <nav>
      <div className="w-full mb-5 px-1">
        <div className="flex justify-between items-center w-full">
          <div className="flex relative items-center justify-center h-[40px] text-sky-500 text-center text-lg font-medium">
            <div className="absolute -inset-px rounded-xl opacity-75 border-2 border-transparent [background:linear-gradient(var(--quick-links-hover-bg,theme(colors.sky.50)),var(--quick-links-hover-bg,theme(colors.sky.50)))_padding-box,linear-gradient(to_top,theme(colors.indigo.400),theme(colors.cyan.400),theme(colors.sky.500))_border-box] dark:[--quick-links-hover-bg:theme(colors.slate.800)]"></div>
            <h2 className="relative">
              <Link href="/">
                <a className="px-10">one / one</a>
              </Link>
            </h2>
          </div>
          <AuthenticationRow />
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
