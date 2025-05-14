import { Link } from "@remix-run/react";
import { motion } from "framer-motion";

interface CallToActionCardProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: React.ReactNode;
  bgColor?: string;
}

export default function CallToActionCard({
  title,
  subtitle,
  buttonText,
  buttonLink,
  image,
  bgColor = "bg-emerald-800",
}: CallToActionCardProps) {
  return (
    <div className={`${bgColor} rounded-2xl p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="mb-6 mt-2 text-sm">{subtitle}</p>
          <Link
            to={buttonLink}
            className="inline-block rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-white transition-all hover:bg-emerald-600"
          >
            {buttonText}
          </Link>
        </div>
        <motion.div
          className="relative flex h-32 w-32 items-center justify-center"
          initial={{ y: 10 }}
          animate={{ y: 0 }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 1.5,
          }}
        >
          {image}
        </motion.div>
      </div>
    </div>
  );
}
