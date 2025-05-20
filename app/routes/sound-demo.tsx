import type { MetaFunction } from "@remix-run/node";
import { SoundDemo } from "~/components/sound-demo";

export const meta: MetaFunction = () => {
  return [
    { title: "Sound Effects Demo - Vocab Builder" },
    {
      name: "description",
      content:
        "Demonstration of the various sound effects available in the application",
    },
  ];
};

export default function SoundDemoRoute() {
  return <SoundDemo />;
}
