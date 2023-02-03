import Link from "next/link";

interface Props {
  currentTab: string;
}

const AccountSettingsNav: React.FC<Props> = ({ currentTab }) => {
  const navItems: { [key: string]: string } = {
    wallets: "Wallets",
    notifications: "Notifications",
    communities: "Communities",
  };

  return (
    <ul className="flex gap-20 px-8 my-8">
      {Object.keys(navItems).map((key) => (
        <li key={key}>
          <Link href={`/account/${key}`}>
            <a className={currentTab === key ? "text-white underline" : ""}>
              {navItems[key]}
            </a>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default AccountSettingsNav;
