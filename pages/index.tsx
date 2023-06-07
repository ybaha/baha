import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { GetServerSideProps } from "next";

const Home = () => {
  const form = useRef<HTMLFormElement>(null);
  const bottomBlur = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [location, setLocation] = useState("TR");

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((response) => response.json())
      .then((data) => {
        setLocation(data?.country || "TR");
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const sendEmail = (e: any) => {
    e.preventDefault();

    if (!form.current || !form.current.reportValidity() || sent) return;
    console.log(form.current);

    setSending(true);
    emailjs
      .sendForm(
        "service_bzl6oki",
        "template_1hrklcw",
        form.current,
        "CZtx8EEbLwcO7RfCd"
      )
      .then(
        (result) => {
          setSent(true);
          localStorage.setItem("sent", "true");
        },
        (error) => {
          setError(true);
        }
      )
      .finally(() => {
        setSending(false);
      });
  };

  const useAutosizeTextArea = (
    textAreaRef: HTMLTextAreaElement | null,
    value: string
  ) => {
    useEffect(() => {
      if (textAreaRef) {
        // We need to reset the height momentarily to get the correct scrollHeight for the textarea
        textAreaRef.style.height = "0px";
        const scrollHeight = textAreaRef.scrollHeight;

        // We then set the height directly, outside of the render loop
        // Trying to set this with state or a ref will product an incorrect value.
        textAreaRef.style.height = scrollHeight + "px";
      }
    }, [textAreaRef, value]);
  };

  const [textAreaValue, setTextAreaValue] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useAutosizeTextArea(textAreaRef.current, textAreaValue);

  const handleTextAreaChange = (
    evt: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const val = evt.target?.value;

    setTextAreaValue(val);
  };

  const getDateString = () => {
    // get english month name
    const date = new Date();
    return `${date.toLocaleString("EN", {
      month: "long",
    })} ${date.getDate()}, ${date.getFullYear()}`;
  };

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("sent") === "true") setSent(true);
    window.addEventListener("scroll", () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 20 >=
          document.documentElement.offsetHeight &&
        bottomBlur.current
      ) {
        bottomBlur.current.style.opacity = "0";
      } else if (
        bottomBlur.current &&
        bottomBlur.current.style.opacity === "0"
      ) {
        bottomBlur.current.style.opacity = "1";
      }
    });

    return () => {
      window.removeEventListener("scroll", () => {});
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center relative">
      <Head>
        <title>Baha Erarslan</title>
        <meta name="description" content="Baha Erarslan's Resume" />
      </Head>

      <div className="fixed z-50 top-0 w-full h-32 bg-gradient-to-b from-[#161616] to-transparent transition-all duration-1000 pointer-events-none"></div>
      <div
        className="fixed z-50 bottom-0 w-full h-32 bg-gradient-to-t from-[#161616] to-transparent transition-all duration-1000 pointer-events-none"
        ref={bottomBlur}
      ></div>

      <main className="container flex flex-col max-w-[720px] px-4 pt-36">
        {/*  Header */}
        <h1 className="text-white fade-in-0">Y. Baha Erarslan</h1>
        <section className="fade-in-1">
          <section className="flex justify-between flex-wrap w-full text-sm text-gray-300 mt-16">
            <div className="text-pink-300">
              Fullstack developer, comp-sci enthusiast
            </div>
            <span className="italic inline text-gray-500 text-right text-xs sm:text-sm">
              Amsterdam, Netherlands
            </span>
          </section>
          <hr className="border-t border-dashed border-gray-500 mt-4 mb-12 sm:mb-20" />
        </section>

        <section className="flex gap-16 sm:gap-0 flex-wrap-reverse justify-between fade-in-2">
          {/* Education */}
          <div className="sm:max-w-[314px]">
            <h2 className="text-white mb-4">Education</h2>
            <div className="">
              <Education
                institution="Atilim University"
                link="https://atilim.edu.tr/en/se"
                date="2020 - 2022"
                degree="BE Software Engineering (Double Major)"
                description={`Dropped out ${
                  location !== "TR" ? "due to forced displacement" : ""
                }`}
              />
              <Education
                institution="Atilim University"
                link="https://atilim.edu.tr/en/ise"
                date="2019 - 2022"
                degree="BE Information Systems Engineering"
                description={`Dropped out ${
                  location !== "TR" ? "due to forced displacement" : ""
                }`}
              />
            </div>
          </div>
          {/* Work experience */}
          <div className="sm:max-w-[314px]">
            <h2 className="text-white mb-4">Work Experience</h2>
            <div className="">
              <WorkExperience
                company="Freelance"
                link=""
                date="Present"
                position="Software Developer"
                description="Providing frontend development mentorship while designing and developing web solutions for a diverse range of clients."
              />
              <WorkExperience
                company="Jotform"
                link="https://jotform.com/"
                date="Sep 2021 - Oct 2021"
                position="Fullstack Developer Intern"
                description="Took part in a team of 3. We have successfully completed a new internal feature project with the help of our mentors. I have mostly worked on Frontend Development of the project."
              />
              <WorkExperience
                company="ikas"
                link="https://ikas.com"
                date="Jun 2021 - Aug 2021"
                position="Frontend Developer Intern"
                description="I was responsible for development of React components and their integration with ikas storefront API for a theme. I have developed a full theme by the end of my internship."
              />
              <WorkExperience
                company="Marktscout"
                link="https://marktscout.de/"
                date="Feb 2021 - Jul 2021"
                position="Fullstack Developer (Contract)"
                description="I was responsible for development of a supplier dashboard, integration of supplier data and Storefront API's (Shopify, real). I have also deployed and monitored the backend application."
              />
            </div>
          </div>
        </section>
        <section className="flex gap-12 sm:gap-0 flex-wrap sm:mt-20 justify-between fade-in-3">
          <div className="sm:max-w-[314px]  mt-16 sm:mt-4">
            <h2 className="text-white">Technologies</h2>
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="text-pink-300 text-xs sm:text-sm font-semibold">
                Proficient with
              </span>
              <Technology name="Typescript" />
              <Technology name="Javascript" />
              <Technology name="React" />
              <Technology name="Next.js" />
              <Technology name="Node.js" />
              <Technology name="Express.js" />
              <Technology name="Prisma" />
              <Technology name="MongoDB" />
              <Technology name="PostgreSQL" />
              <Technology name="Firebase" />
              <Technology name="Tailwind CSS" />
              <Technology name="GraphQL" />
            </div>
            <div className="flex flex-wrap gap-2 mt-8">
              <span className="text-pink-300 text-xs sm:text-sm font-semibold ">
                Familiar with
              </span>
              <Technology name="React Native" />
              <Technology name="Supabase" />
              <Technology name="Heroku" />
              <Technology name="Github CI/CD (Actions)" />
              <Technology name="SASS" />
              <Technology name="Python" />
            </div>
          </div>
          <div className="sm:max-w-[314px] w-full sm:w-[314px] h-[400px] mt-12 sm:mt-4 text-white">
            <h2 className="mb-4 w-full">Contact</h2>
            {sent ? (
              <div className="w-full text-sm text-pink-300">
                <p>You have sent me a message.</p>
                <p className="mt-1">
                  I will get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <form ref={form} onSubmit={sendEmail}>
                <label htmlFor="senderEmail" className="text-sm">
                  Email
                </label>
                <input
                  type="email"
                  name="senderEmail"
                  id="email"
                  placeholder="example@mail.com"
                  className="w-full bg-transparent border-b border-dashed border-gray-500 text-gray-400 outline-pink-400 placeholder:text-gray-500 focus:bg-transparent placeholder:text-sm text-sm mb-8 py-0.5 "
                />
                <label htmlFor="message" className="text-sm">
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  maxLength={1000}
                  onChange={handleTextAreaChange}
                  className="w-full border-b border-dashed border-gray-500 text-gray-400 outline-pink-400 bg-transparent max-h-[200px] h-[25px] resize-none min-h-[25px]"
                  value={textAreaValue}
                  ref={textAreaRef}
                ></textarea>
                <div className="w-full flex justify-end">
                  <button
                    type="submit"
                    value="submit"
                    className="text-sm py-2 mt-2 text-right hover:text-pink-300"
                  >
                    {error
                      ? "Something went wrong"
                      : sending
                      ? "Sending..."
                      : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
        <footer className="flex items-center justify-between border-t border-dashed border-gray-500 mt-4 sm:mt-12 py-12 sm:py-16 fade-in-4">
          <div className="reg-marks flex gap-2">
            <div className="w-4 h-4 rounded-full bg-pink-300"></div>
            <div className="w-4 h-4 rounded-full bg-red-800"></div>
            <div className="w-4 h-4 rounded-full bg-black"></div>
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
          </div>
          <div className="text-gray-500 text-sm italic ml-6">
            {mounted && getDateString()}
          </div>
        </footer>
      </main>
    </div>
  );
};

const Technology = (props: { name: string }) => {
  const { name } = props;
  return (
    <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
      {name}
    </span>
  );
};

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

export default Home;
