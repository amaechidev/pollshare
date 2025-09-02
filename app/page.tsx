"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Shield, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="min-h-screen flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to <span className="text-blue-600">PollShare</span>
        </h1>

        <p className="mt-3 text-2xl">
          The easiest way to create and manage polls.
        </p>

        <div className="flex items-center justify-around mt-6 space-x-4">
          <Button
            variant={"outline"}
            className="px-6 py-4 border text-base font-medium rounded-md "
          >
            <Link href="/auth/login" className="">
              Login
            </Link>
          </Button>
          <Button className="px-6 py-4 text-base font-medium rounded-md ">
            <Link href="/auth/register" className="">
              Register
            </Link>
          </Button>
        </div>
      </main>

      {/* Features Section */}
      <section
        className={`py-24 relative transition-colors duration-500 bg-gradient-to-br from-gray-50 to-white
          }`}
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-indigo-600  to-cyan-600 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p
              className={`text-xl max-w-2xl mx-auto text-gray-600
                `}
            >
              Everything you need to create engaging polls and gather meaningful
              insights
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card
              className={`transition-all duration-300 hover:scale-105 hover:shadow-2xl group
                    bg-white backdrop-blur-sm border-gray-200 hover:border-purple-500/50 shadow-lg
                `}
            >
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  Lightning Fast
                </h3>
                <p className="leading-relaxed text-gray-600">
                  Create polls in under 30 seconds. Our streamlined interface
                  gets you from idea to published poll instantly.
                </p>
              </CardContent>
            </Card>

            <Card
              className={`transition-all duration-300 hover:scale-105 hover:shadow-2xl group bg-white backdrop-blur-sm border-gray-200 hover:border-cyan-500/50 shadow-lg"
                `}
            >
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${"text-gray-900"}`}>
                  Real-time Analytics
                </h3>
                <p className={`leading-relaxed ${"text-gray-600"}`}>
                  Watch votes pour in live with beautiful charts and instant
                  insights. No refresh needed.
                </p>
              </CardContent>
            </Card>

            <Card
              className={`transition-all duration-300 hover:scale-105 hover:shadow-2xl group 
                  bg-white backdrop-blur-sm border-gray-200 hover:border-green-500/50 shadow-lg
                `}
            >
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3
                  className={`text-2xl font-bold mb-4text-gray-900
                    `}
                >
                  Duplicate Prevention
                </h3>
                <p
                  className={`leading-relaxed "text-gray-600
                    `}
                >
                  Advanced multi-layer protection ensures fair voting with IP,
                  fingerprint, and user tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        className={`py-24 relative transition-colors duration-500 bg-white
          `}
      >
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-indigo-600  to-cyan-600 bg-clip-text text-transparent">
                Why Choose PollShare?
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4 group">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3
                      className={`text-xl font-bold mb-2text-gray-900
                        `}
                    >
                      Instant Setup
                    </h3>
                    <p className="text-gray-600">
                      No registration required for voters. Share a link and
                      start collecting responses immediately.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3
                      className={`text-xl font-bold mb-2 text-gray-900
                        `}
                    >
                      Fraud Protection
                    </h3>
                    <p className="text-gray-600">
                      Multi-layer duplicate prevention ensures fair and accurate
                      voting results.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3
                      className={`text-xl font-bold mb-2 text-gray-900
                        `}
                    >
                      Beautiful Analytics
                    </h3>
                    <p className="text-gray-600">
                      Gorgeous real-time charts and exportable data for deeper
                      insights into your results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="flex items-center justify-center w-full h-24 border-t">
        <a
          className="flex items-center justify-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by PollShare
        </a>
      </footer>
    </div>
  );
}
