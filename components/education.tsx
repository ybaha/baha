type EducationProps = {
  institution: string;
  link: string;
  date: string;
  degree: string;
  description: string;
};

const Education = (props: EducationProps) => {
  const { institution, link, date, degree, description } = props;
  return (
    <div className="flex flex-col mt-6">
      <div className="flex">
        <a
          href={link}
          target="__blank"
          rel="noreferrer"
          className="text-white hover:text-pink-300 transition-all duration-150 cursor-pointer  decoration-dashed text-sm"
        >
          {institution}
        </a>
        <span className="mx-2 sm:mx-3 flex justify-center items-center">
          <div className="w-1 h-1 rounded-full bg-gray-500"></div>
        </span>
        <span className="italic flex items-center text-right text-xs sm:text-sm text-gray-500">
          {date}
        </span>
      </div>
      <span className="text-gray-300 text-xs sm:text-sm mt-1">{degree}</span>
      <p className="text-gray-500 text-sm mt-2 sm:h-[100px] ">{description}</p>
    </div>
  );
};

export default Education;
