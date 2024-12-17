"use client";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import React from "react";

const Page = () => {
  const isProd = process.env.NODE_ENV === "production";
  const [title, setTitle] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [content, setContent] = React.useState("");

  React.useEffect(() => {
    if (!isProd) return;

    redirect("/");
  }, []);

  if (isProd) return redirect("/");

  return (
    <div className="p-6 w-full">
      <h1>Admin Page</h1>
      <p>This is an admin page</p>
      <section className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-2">
          <label>title</label>
          <textarea onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label>about</label>
          <textarea onChange={(e) => setAbout(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label>content</label>
          <textarea onChange={(e) => setContent(e.target.value)} />
        </div>
        <Button
          className="btn"
          onClick={async () => {
            const res = await fetch("/api/write", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title,
                about,
                content,
              }),
            });

            if (res.ok) {
              alert("Success");
            } else {
              alert("Failed");
            }
          }}
        >
          Submit
        </Button>
      </section>
    </div>
  );
};

export default Page;
