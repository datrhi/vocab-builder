import { Link } from "@remix-run/react";
import {
  BookOpen,
  Building2,
  Film,
  FlaskConical,
  Globe2,
  HelpCircle,
  Home,
  Languages,
  Trophy,
} from "lucide-react";

const categories = [
  { name: "Start", icon: <Home size={20} />, path: "/" },
  {
    name: "Art & Literature",
    icon: <BookOpen size={20} />,
    path: "/category/art-literature",
  },
  {
    name: "Entertainment",
    icon: <Film size={20} />,
    path: "/category/entertainment",
  },
  {
    name: "Geography",
    icon: <Globe2 size={20} />,
    path: "/category/geography",
  },
  { name: "History", icon: <Building2 size={20} />, path: "/category/history" },
  {
    name: "Languages",
    icon: <Languages size={20} />,
    path: "/category/languages",
  },
  {
    name: "Science & Nature",
    icon: <FlaskConical size={20} />,
    path: "/category/science-nature",
  },
  { name: "Sports", icon: <Trophy size={20} />, path: "/category/sports" },
  { name: "Trivia", icon: <HelpCircle size={20} />, path: "/category/trivia" },
];

export default function CategoryNav() {
  return (
    <nav className="mx-auto my-4 max-w-6xl overflow-x-auto pb-2">
      <ul className="flex w-full items-center justify-between gap-2 px-4">
        {categories.map((category) => (
          <li key={category.name}>
            <Link
              to={category.path}
              className="flex flex-col items-center justify-center rounded-lg px-2 py-2 text-center text-xs transition-all hover:bg-gray-100 sm:text-sm"
            >
              <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                {category.icon}
              </span>
              <span className="font-medium text-gray-700">{category.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
