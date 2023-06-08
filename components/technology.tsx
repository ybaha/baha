const Technology = (props: { name: string }) => {
  const { name } = props;
  return (
    <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
      {name}
    </span>
  );
};

export default Technology;
