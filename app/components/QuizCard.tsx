import { Link } from "@remix-run/react";
import { Star } from "lucide-react";

interface QuizCardProps {
  id: string;
  title: string;
  author: string;
  rating: number;
  image: string;
  isAiGenerated?: boolean;
}

export default function QuizCard({
  id,
  title,
  author,
  rating,
  image,
  isAiGenerated = false,
}: QuizCardProps) {
  return (
    <Link to={`/quiz/${id}`} className="quiz-card block">
      <div className="relative aspect-video w-full overflow-hidden">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        {isAiGenerated && (
          <span className="absolute left-2 top-2 rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
            AI GENERATED
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm text-gray-500">By {author}</span>
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700">{rating}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
