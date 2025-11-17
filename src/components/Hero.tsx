import { Star } from "lucide-react";
import React from "react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Hero7Props {
  heading?: string;
  description?: string;
  button?: {
    text: string;
    url: string;
  };
  reviews?: {
    count: number;
    rating?: number;
    avatars: {
      src: string;
      alt: string;
    }[];
  };
}

const Hero7 = ({
  heading = "Where Excellence Meets Every Grain",
  description = "At Ursal Rice Milling Services, we elevate the rice milling process, ensuring each grain meets our highest standards. Pure, fresh, and full of flavor, our rice brings excellence to every meal.",
  button = {
    text: "Browse Categories",
    url: "http://localhost:3000/categories",
  },
  reviews = {
    count: 100,
    rating: 5.0,
    avatars: [
      {
        src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-1.webp",
        alt: "Avatar 1",
      },
      {
        src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp",
        alt: "Avatar 2",
      },
      {
        src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-3.webp",
        alt: "Avatar 3",
      },
      {
        src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-4.webp",
        alt: "Avatar 4",
      },
      {
        src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-5.webp",
        alt: "Avatar 5",
      },
    ],
  },
}: Hero7Props) => {
  return (
    <section className="relative min-h-[70vh] flex items-center py-24">
  <div className="relative mx-auto w-full max-w-5xl px-6">
    <div className="max-w-xl text-left flex flex-col gap-6">
      <h1 className="text-white text-4xl lg:text-6xl font-extrabold leading-tight">
        {heading}
      </h1>

      <p className="text-white/85 lg:text-lg leading-relaxed">
        {description}
      </p>

      <div className="mt-4">
        <Button
          asChild
          size="lg"
          className="bg-custom-orange text-white hover:bg-yellow-600  font-semibold rounded-full px-6 py-3"
        >
          <a href={button.url}>{button.text}</a>
        </Button>
      </div>
    </div>
  </div>
</section>
  );
};

export { Hero7 };
