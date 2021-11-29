const NUM_LOADING_ITEMS = 24;
const LoadingGrid: React.FC = () => {
  return (
    <div className="mt-10 mx-1 grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-6">
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
