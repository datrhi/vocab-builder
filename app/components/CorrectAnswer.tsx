import { motion } from "framer-motion";

interface CorrectAnswerProps {
  answer: string;
  image: string;
}

export const CorrectAnswer = ({ answer, image }: CorrectAnswerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white shadow-lg max-w-md mx-auto text-center"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Correct Answer</h2>

      <div className="w-full mb-6 overflow-hidden rounded-lg">
        {image ? (
          <img src={image} alt={answer} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="px-6 py-3 bg-emerald-100 rounded-full border-2 border-emerald-500"
      >
        <span className="text-xl font-bold text-emerald-700">{answer}</span>
      </motion.div>

      <p className="mt-4 text-gray-600">Well done to those who got it right!</p>
    </motion.div>
  );
};

export default CorrectAnswer;
