import OpenAI from "openai";
import axios from "axios";
import fs from "fs/promises";
import matter from "gray-matter";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const isProduction = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
  // if building project, return nothing
  if (request.headers.get("x-nf-request-id"))
    return new Response(null, { status: 200 });

  if (isProduction) return new Response("Not allowed in production");

  const { about, content, title_ } = await request.json();

  // const about = request.nextUrl.searchParams.get("about")?.toString() as
  //   | string
  //   | undefined;

  // const title_ = request.nextUrl.searchParams.get("title")?.toString() as
  //   | string
  //   | undefined;

  // const content = request.nextUrl.searchParams.get("content")?.toString() as
  //   | string
  //   | undefined;

  console.log(about);

  const title = title_ || (await generateTitle(about));

  const postText = await generatePost(title || "", about, content);

  if (!postText) return new Response("Error generating post");

  const post = await parsePost(postText!);
  console.log(post);

  if (!post || !post.frontMatter.image)
    return new Response(
      "Error parsing post:\n " + post + "\n" + "posttext: " + "\n" + postText
    );

  await writePost(postText, post.frontMatter.slug);

  const res = {
    title: post.frontMatter.title,
    slug: post.frontMatter.slug,
    date: post.frontMatter.date,
    description: post.frontMatter.description,
    postUrlDev: "http://localhost:3000/writings/" + post.frontMatter.slug,
    postUrlProd: "https://poshet.co/writings/" + post.frontMatter.slug,
  };

  return new Response(JSON.stringify(res));
}

const prompt = (
  postImageUrl: string,
  title: string,
  about?: string,
  content?: string
) => `
You are a bot that writes content for Yusuf Baha Erarslan's blog.
generate a blog post article for the title ${title} ${
  about ? `which is about "${about}"` : ""
}. and write it following this mdx template.
${content ? `Content: ${content}` : ""}
Talk about very specific topics in the post that are useful for people to read.
Sound semi-professional also casual. Use a friendly tone. Be descriptive and clear.
Longest paragraph should be around 8-12 sentences.Shortest paragraph should be around 5 sentences.
Total word count should be between 1k and 1.5k words.
Sometimes sound witty and funny but not too much. Dive deep into the topic and give useful information.
don't add any words or sentences to your response just return the mdx content.
Always start with an introductory heading (without including obvious introductory terms like "introduction to", just rephrase the title in a different way) and a brief introductory description of the topic.
make use of the markdown properties. (use lists quotes and other things if needed) (don't use the biggest heading #. instead use ## for each title)
Only give the mdx content as a response! no other words or sentences!
template:
---
title: ...(escape quotes using \" also escape colons using \:)
slug: ... (title.toLoweCase().replaceAll(' ','-'))
date: "..." (ex: 2022-04-24 21:33:14. random date between 2023-01-01 and ${new Date()
  .toISOString()
  .slice(0, 10)}. also random time between 00:00:00 and 23:59:59)
description: "..."
image: ${postImageUrl}
author: Yusuf Baha Erarslan
aiGenerated: true
---
(content here)        
`;

async function writePost(postText: string, title: string) {
  const filename = title + ".mdx";

  await fs
    .writeFile(process.cwd() + "/content/writings/" + filename, postText)
    .catch((e) => {
      console.log("error1:");
      console.log(e);
    });

  return true;
}

async function parsePost(post: string) {
  const { data: frontMatter, content } = matter(post);

  return {
    frontMatter,
    content,
  };
}

async function generateTitle(about?: string) {
  const allposts = await fs.readdir(process.cwd() + "/content/writings/");

  const titleRes = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "system",
        content: `
            Generate a blog post idea that is useful for people to read ${
              !!about
                ? `about "${about}".`
                : ". Select a specific title on a very specific topic"
            }. Return only the title of the post as a response no other comments or words. 
            Try to keep the title between 5-9 words. If possible try to make it click-baity but not too much. Also it can be witty and fun. Keeping the information and what post is about very clear.
            Make sure the title is not already in the list and it is distinct from the other titles. Don't create a title that is too similar to the other titles both content wise and word wise.
            Don't use semicolon (:) in title! Keep the title SEO friendly!
            Bad title: "Seizing Opportunity: 7 Untapped SaaS Niches for Solo Founders in 2024" Good title: "7 Untapped SaaS Niches for Solo Founders in 2024"
            This is the post list that contains posts that are already on the website:
            ${allposts.map((post) => post.replace(".mdx", "")).join(", ")}
          `,
      },
    ],
  });

  const title = titleRes.choices[0].message.content;
  console.log("title: " + title);

  return title;
}

async function generatePost(title: string, about?: string, content?: string) {
  const imageUrl = await generateImage(title);
  console.log("imageUrl: " + imageUrl);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt(imageUrl, title, about, content),
      },
    ],
  });

  if (!response) return;

  const text1 = response.choices[0].message.content;
  let textMerged = text1 || "";

  // if finish reason is not stop then call again
  if (response.choices[0].finish_reason !== "stop") {
    const response2 = await openai.chat.completions.create({
      model: "gpt-4o-2024-05-13",
      messages: [
        {
          role: "system",
          content: prompt(imageUrl, title, about),
        },
        {
          role: "assistant",
          content: response.choices[0].message.content,
        },
      ],
    });

    const text2 = response2.choices[0].message.content;
    textMerged = text1! + text2!;
  }

  return textMerged;
}

const generateImage = async (title: string) => {
  const imagePromptResponse = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    messages: [
      {
        content: `Generate an AI image generation prompt for this title: ${title}.
          Response should be simple and short. Don't add any words or sentences to your response just return the image prompt.
          Response shouldn't include text related stuff. It should describe something visual.
          Example: Title: "Can AI take over the world?" Response: "A robot and a human playing chess."
          `,
        role: "system",
      },
    ],
  });
  const imagePrompt = imagePromptResponse.choices[0].message.content;
  console.log(imagePrompt);
  const response = await openai.images.generate({
    model: "dall-e-3",
    size: "1024x1024",
    prompt: imagePrompt || "Random tech related image",
    n: 1,
  });

  const url = response.data[0].url;

  // dowmload image from url and save it to the public folder using fs
  // return the path to the image

  let imgbbRes;

  try {
    imgbbRes = await axios.get("https://api.imgbb.com/1/upload", {
      params: {
        key: process.env.IMGBB_API_KEY,
        image: url,
      },
    });
  } catch (e: any) {
    console.log(e.error);
    console.log(e.response.data);
    console.log(e.response.error);
  }

  if (!imgbbRes) return;

  const url2 = imgbbRes.data.data.url;

  return url2;
};
