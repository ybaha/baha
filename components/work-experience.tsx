type WorkExperienceProps = {
  company: string;
  link: string;
  date: string;
  position: string;
  description: string;
};

const WorkExperience = (props: WorkExperienceProps) => {
  const { company, link, date, position, description } = props;
  return (
    <div className="flex flex-col">
      <div className="flex">
        <a
          href={link}
          onClick={(e) => !link && e.preventDefault()}
          target="_blank"
          rel="noreferrer"
          className="text-white hover:text-pink-300 transition-all duration-150 cursor-pointer  decoration-dashed text-sm"
        >
          {company}
        </a>
        <span className="mx-2 sm:mx-3 flex justify-center items-center">
          <div className="w-1 h-1 rounded-full bg-gray-500"></div>
        </span>
        <span className="italic flex items-center text-right text-xs sm:text-sm text-gray-500">
          {date}
        </span>
      </div>
      <span className="text-gray-300 text-xs sm:text-sm mt-1">{position}</span>
      <p className="text-gray-500 text-sm mt-2 sm:h-[100px] ">{description}</p>
    </div>
  );
};

export default WorkExperience;
