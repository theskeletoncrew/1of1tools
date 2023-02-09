const NUM_LOADING_ITEMS = 24;

interface Props {
  className?: string | undefined;
}

const LoadingGrid: React.FC<Props> = ({ className }) => {
  return (
    <div className={`${className ?? ""} grid`}>
      {[...Array(NUM_LOADING_ITEMS)].map((_, i) => (
        <div key={i} className="text-center">
          <div className="w-full aspect-1 rounded-lg bg-indigo-500 bg-opacity-10 animate-pulse"></div>
          <span className="w-1/2 inline-block mt-2 bg-indigo-500 bg-opacity-10 animate-pulse">
            &nbsp;
          </span>
        </div>
      ))}
    </div>
  );
};

export default LoadingGrid;
