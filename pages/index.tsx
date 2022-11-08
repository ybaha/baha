import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";

const Home = () => {
  const form = useRef<HTMLFormElement>(null);
  const bottomBlur = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

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

  const getDateString = () => {
    const date = new Date();
    return `${date.toLocaleString("default", {
      month: "long",
    })} ${date.getDate()}, ${date.getFullYear()}`;
  };

  useEffect(() => {
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

        {/* Education */}
        <section className="flex gap-16 sm:gap-0 flex-wrap-reverse justify-between fade-in-2">
          <div className="sm:max-w-[314px]">
            <h2 className="text-white mb-4">Education</h2>
            <div className="">
              <div className="flex flex-col">
                <div className="flex">
                  <a
                    href="https://vu.nl/en/"
                    target="__blank"
                    rel="noreferrer"
                    className="text-white hover:text-pink-300 transition-all duration-150 cursor-pointer  decoration-dashed text-sm"
                  >
                    Vrije University Amsterdam
                  </a>
                  <span className="mx-2 sm:mx-3 flex justify-center items-center">
                    <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                  </span>
                  <span className="italic flex items-center text-right text-xs sm:text-sm text-gray-500">
                    2022 - 2025
                  </span>
                </div>
                <span className="text-gray-300 text-xs sm:text-sm mt-1">
                  BSc Computer Science
                </span>
                <p className="text-gray-500 text-sm mt-2 sm:h-[100px] ">
                  Exempted from some courses due to my previous education.
                </p>
              </div>
              <div className="flex flex-col mt-6 sm:mt-8">
                <div className="flex">
                  <a
                    href="https://atilim.edu.tr/en/"
                    target="__blank"
                    rel="noreferrer"
                    className="text-white hover:text-pink-300 transition-all duration-150 cursor-pointer  decoration-dashed text-sm"
                  >
                    Atilim University
                  </a>
                  <span className="mx-2 sm:mx-3 flex justify-center items-center">
                    <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                  </span>
                  <span className="italic flex items-center text-right text-xs sm:text-sm text-gray-500">
                    2020 - 2022
                  </span>
                </div>
                <span className="text-gray-300 text-xs sm:text-sm mt-1">
                  BE Software Engineering (Double Major)
                </span>
                <p className="text-gray-500 text-sm mt-2 sm:h-[100px] ">
                  Dropped out
                </p>
              </div>
              <div className="flex flex-col mt-6 sm:mt-8">
                <div className="flex">
                  <a
                    href="https://atilim.edu.tr/en/"
                    target="__blank"
                    rel="noreferrer"
                    className="text-white hover:text-pink-300 transition-all duration-150 cursor-pointer  decoration-dashed text-sm"
                  >
                    Atilim University
                  </a>
                  <span className="mx-2 sm:mx-3 flex justify-center items-center">
                    <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                  </span>
                  <span className="italic flex items-center text-right text-xs sm:text-sm text-gray-500">
                    2019 - 2022
                  </span>
                </div>
                <span className="text-gray-300 text-xs sm:text-sm mt-1">
                  BE Information Systems Engineering
                </span>
                <p className="text-gray-500 text-sm mt-2 sm:h-[100px] ">
                  Dropped out
                </p>
              </div>
            </div>
          </div>
          <div className="sm:max-w-[314px]">
            <h2 className="text-white mb-4">Work Experience</h2>
            <div className="">
              <div className="flex flex-col">
                <div className="flex">
                  <a
                    href="https://jotform.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-pink-300 transition-all duration-150 cursor-pointer  decoration-dashed text-sm"
                  >
                    Jotform
                  </a>
                  <span className="mx-2 sm:mx-3 flex justify-center items-center">
                    <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                  </span>
                  <span className="italic flex items-center text-right text-xs sm:text-sm text-gray-500">
                    Sep 2021 - Oct 2021
                  </span>
                </div>
                <span className="text-gray-300 text-xs sm:text-sm mt-1">
                  Fullstack Developer Intern
                </span>
                <p className="text-gray-500 text-sm mt-2 sm:h-[100px] ">
                  Took part in a team of 3. We have successfully completed a new
                  internal feature project with the help of our mentors. I have
                  mostly worked on Frontend Development of the project.
                </p>
              </div>
              <div className="flex flex-col mt-6 sm:mt-8">
                <div className="flex">
                  <a
                    href="https://ikas.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-pink-300 transition-all duration-150 cursor-pointer  decoration-dashed text-sm"
                  >
                    ikas
                  </a>
                  <span className="mx-2 sm:mx-3 flex justify-center items-center">
                    <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                  </span>
                  <span className="italic flex items-center text-right text-xs sm:text-sm text-gray-500">
                    Jun 2021 - Aug 2021
                  </span>
                </div>
                <span className="text-gray-300 text-xs sm:text-sm mt-1">
                  Frontend Developer Intern
                </span>
                <p className="text-gray-500 text-sm mt-2 sm:h-[100px] ">
                  I was responsible for development of React components and
                  their integration with ikas storefront API for a theme. I have
                  developed a full theme by the end of my internship.
                </p>
              </div>
              <div className="flex flex-col mt-6 sm:mt-8">
                <div className="flex">
                  <a
                    href="https://marktscout.de/"
                    target="__blank"
                    rel="noreferrer"
                    className="text-white hover:text-pink-300 transition-all duration-150 cursor-pointer  decoration-dashed text-sm"
                  >
                    Marktscout
                  </a>
                  <span className="mx-2 sm:mx-3 flex justify-center items-center">
                    <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                  </span>
                  <span className="italic flex items-center text-right text-xs sm:text-sm text-gray-500">
                    Feb 2021 - Jul 2021
                  </span>
                </div>
                <span className="text-gray-300 text-xs sm:text-sm mt-1">
                  Fullstack Developer (Contract)
                </span>
                <p className="text-gray-500 text-sm mt-2 sm:h-[100px] ">
                  I was responsible for development of a supplier dashboard,
                  integration of supplier data and Storefront API&apos;s
                  (Shopify, real). I have also deployed and monitored the
                  backend application.
                </p>
              </div>
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
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Typescript
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Javascript
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                React
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Next.js
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Node.js
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Express.js
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Prisma
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                MongoDB
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                PostgreSQL
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Firebase
              </span>

              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Tailwind CSS
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-8">
              <span className="text-pink-300 text-xs sm:text-sm font-semibold ">
                Familiar with
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                React Native
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Supabase
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Heroku
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                Github CI/CD (Actions)
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                MongoDB
              </span>
              <span className="text-gray-300 text-xs sm:text-sm hover:text-pink-300 cursor-pointer">
                SASS
              </span>
            </div>
          </div>
          <div className="sm:max-w-[314px] w-full sm:w-[314px] mt-12 sm:mt-4 text-white">
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
                  className="w-full border-b border-dashed border-gray-500 text-gray-400 outline-pink-400 bg-transparent max-h-[200px] h-[25px] min-h-[25px]"
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
        <footer className="flex items-center justify-between border-t border-dashed border-gray-500 mt-36 sm:mt-48 py-12 sm:py-16 fade-in-4">
          <div className="reg-marks flex gap-2">
            <div className="w-4 h-4 rounded-full bg-pink-300"></div>
            <div className="w-4 h-4 rounded-full bg-red-800"></div>
            <div className="w-4 h-4 rounded-full bg-black"></div>
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
          </div>
          <div className="text-gray-500 text-sm italic ml-6">
            {getDateString()}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Home;
