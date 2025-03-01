import React, { useEffect, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import FeatureCard from "./features/FeatureCard";
import { HomePageProps } from "../types";
import CompanyContextFeature from "./features/CompanyContextFeature";

const HomePage: React.FC<HomePageProps> = ({
  isDarkMode,
  toggleDarkMode,
  onStartSequence,
}) => {

  const handleDarkModeToggle = (
    e: React.MouseEvent<HTMLButtonElement>
  ): void => {
    e.preventDefault();
    toggleDarkMode();
  };
  const createSessionToken = useCallback(async (): Promise<string | null> => {
    const guestToken = localStorage.getItem("guestToken");
    if (!guestToken) {
      throw new Error("Guest token not found");
    }
    try {
      const response = await fetch("http://127.0.0.1:5000/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_token: guestToken }),
      });
      const data = await response.json();
      if (data.session_id) {
        console.log(data.session_id);
        localStorage.setItem("sessionId", data.session_id);
        return data.session_id;
      }
      throw new Error("Session creation failed");
    } catch (error) {
      console.error("Session creation error:", error);
      return null;
    }
  }, []);

 

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-800 dark:bg-white rounded-xl flex items-center justify-center">
            <span className="text-white dark:text-gray-800 text-xl">R</span>
          </div>
          <span className="text-gray-800 dark:text-white font-medium">
          RecruitFlow
          </span>
        </div>
        <button
          type="button"
          onClick={handleDarkModeToggle}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 
                    transition-all duration-200 cursor-pointer focus:outline-none 
                    focus:ring-2 focus:ring-white/20 relative"
          aria-label={
            isDarkMode ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-gray-100" />
          ) : (
            <Moon className="w-5 h-5 text-gray-800" />
          )}
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <div
          className="w-16 h-16 bg-gray-800 dark:bg-white rounded-2xl flex items-center justify-center mb-6
                     hover:shadow-xl transition-all duration-300 cursor-pointer hover:rotate-12"
        >
          <svg
            className="w-8 h-8 text-white dark:text-gray-800"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z"
            />
          </svg>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white text-center mb-4">
          Hi, Welcome to RecruitFlow
        </h1>
        <h2 className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-white text-center mb-3">
          Can I help you with anything?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-12">
          Ready to assist you with your HR outreach needs, from creating
          sequences to optimizing engagement.
        </p>

        <button
          onClick={async () => {
            try {
              await createSessionToken();
              onStartSequence();
            } catch (error) {
              console.error(error);
            }
          }}
          className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl 
                   transition-all duration-300 flex items-center gap-3 group mb-12
                   hover:-translate-y-1 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div
            className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center
                        group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors"
          >
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <span className="text-gray-800 dark:text-white font-medium">
            Start a Sequence
          </span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <CompanyContextFeature />
          <FeatureCard
            icon={
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
            title="AI-Powered"
            description="Smart recruitment automation"
            color="green"
          />
          <FeatureCard
            icon={
              <svg
                className="w-5 h-5 text-orange-600 dark:text-orange-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title="Time-Saving"
            description="Streamlined outreach process"
            color="orange"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
