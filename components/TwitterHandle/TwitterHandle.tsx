interface Props {
  handle: string;
}

const TwitterHandle: React.FC<Props> = ({ handle }) => {
  return (
    <a
      className="block text-base text-indigo-400"
      href={`https://twitter.com/${handle}`}
    >
      @{handle}
    </a>
  );
};

export default TwitterHandle;
