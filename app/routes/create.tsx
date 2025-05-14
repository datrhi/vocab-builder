import { Copy, PlayCircle, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import Header from "~/components/Header";

interface Question {
  id: string;
  type: string;
  text: string;
  options: string[];
  answer: string | string[];
  timeLimit: number;
}

export default function Create() {
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q1",
      type: "multiple-choice",
      text: "What is the capital of France?",
      options: ["Paris", "London", "Berlin", "Madrid"],
      answer: "Paris",
      timeLimit: 30,
    },
  ]);
  const [selectedQuestion, setSelectedQuestion] = useState(0);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${questions.length + 1}`,
      type: "multiple-choice",
      text: "New question",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      answer: "Option 1",
      timeLimit: 30,
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestion(questions.length);
  };

  const updateQuestion = (field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[selectedQuestion] = {
      ...updatedQuestions[selectedQuestion],
      [field]: value,
    };
    setQuestions(updatedQuestions);
  };

  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...questions[selectedQuestion].options];
    updatedOptions[index] = value;
    updateQuestion("options", updatedOptions);
  };

  const handleQuestionTypeChange = (type: string) => {
    updateQuestion("type", type);
    if (type === "true-false") {
      updateQuestion("options", ["True", "False"]);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-72 flex-col border-r border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Quiz title"
              className="w-full rounded-lg border-gray-300 bg-gray-50 text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className={`mb-2 cursor-pointer rounded-lg p-3 text-sm ${
                  selectedQuestion === index
                    ? "bg-emerald-50 text-emerald-700"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedQuestion(index)}
              >
                <div className="font-medium">Question {index + 1}</div>
                <div className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {question.text || "New question"}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-3">
            <button
              onClick={addQuestion}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-100"
            >
              <Plus size={16} />
              Add question
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {questions.length > 0 && (
            <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Question {selectedQuestion + 1}
                </h2>
                <div className="flex items-center gap-2">
                  <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100">
                    <Copy size={18} />
                  </button>
                  <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Question type
                </label>
                <select
                  value={questions[selectedQuestion].type}
                  onChange={(e) => handleQuestionTypeChange(e.target.value)}
                  className="w-full rounded-lg border-gray-300"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="short-answer">Short Answer</option>
                  <option value="puzzle">Puzzle</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Question text
                </label>
                <textarea
                  value={questions[selectedQuestion].text}
                  onChange={(e) => updateQuestion("text", e.target.value)}
                  className="w-full rounded-lg border-gray-300"
                  rows={3}
                ></textarea>
              </div>

              {questions[selectedQuestion].type === "multiple-choice" && (
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Answer options
                  </label>
                  {questions[selectedQuestion].options.map((option, index) => (
                    <div key={index} className="mb-2 flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={questions[selectedQuestion].answer === option}
                        onChange={() => updateQuestion("answer", option)}
                        className="h-4 w-4 accent-emerald-500"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1 rounded-lg border-gray-300 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Time limit (seconds)
                </label>
                <input
                  type="number"
                  value={questions[selectedQuestion].timeLimit}
                  onChange={(e) =>
                    updateQuestion("timeLimit", parseInt(e.target.value))
                  }
                  min="5"
                  max="120"
                  className="w-full rounded-lg border-gray-300"
                />
              </div>
            </div>
          )}
        </main>

        <aside className="w-64 border-l border-gray-200 bg-white p-4">
          <h3 className="mb-4 font-semibold text-gray-700">Quiz settings</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Category
              </label>
              <select className="w-full rounded-lg border-gray-300 text-sm">
                <option>Education</option>
                <option>Entertainment</option>
                <option>Sports</option>
                <option>Science</option>
                <option>Geography</option>
                <option>History</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Visibility
              </label>
              <select className="w-full rounded-lg border-gray-300 text-sm">
                <option>Public</option>
                <option>Private</option>
                <option>Unlisted</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Cover image
              </label>
              <button className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500 hover:bg-gray-100">
                Click to upload
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
              <Save size={16} />
              Save
            </button>
            <button className="flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              <PlayCircle size={16} />
              Test
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
