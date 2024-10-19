"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui-conversationsPage/card";
import { Button } from "../components/ui-conversationsPage/button";
import { Badge } from "../components/ui-conversationsPage/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui-conversationsPage/accordion";
import {
  MessageSquare,
  User,
  Bot,
  RefreshCw,
  BellRing,
  Home,
  Utensils,
  HelpCircle,
} from "lucide-react";

// Mock data for unread conversations grouped by segments
const unreadConversationsBySegment = {
  Accommodation: [
    {
      id: 1,
      guest: "John Doe",
      subject: "Check-in Time",
      lastMessage:
        "Hi, I was wondering if it's possible to check in earlier than the listed time?",
      timestamp: "2023-06-15T22:30:00Z",
    },
    {
      id: 2,
      guest: "Emily Brown",
      subject: "Parking Availability",
      lastMessage: "Is there on-site parking available for guests?",
      timestamp: "2023-06-15T21:45:00Z",
    },
  ],
  Amenities: [
    {
      id: 3,
      guest: "Mike Johnson",
      subject: "Wi-Fi Password",
      lastMessage:
        "Could you please provide the Wi-Fi password for the apartment?",
      timestamp: "2023-06-15T18:20:00Z",
    },
  ],
  "Local Tips": [
    {
      id: 4,
      guest: "Sarah Smith",
      subject: "Restaurant Recommendation",
      lastMessage: "Can you recommend a good local restaurant for dinner?",
      timestamp: "2023-06-15T19:10:00Z",
    },
    {
      id: 5,
      guest: "David Lee",
      subject: "Public Transportation",
      lastMessage:
        "What's the best way to get to the city center using public transportation?",
      timestamp: "2023-06-15T20:05:00Z",
    },
  ],
};

// Simulated API call for generating auto-response
const generateAutoResponse = async (message: string) => {
  // In a real application, this would be an API call to your LLM service
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
  return `Thank you for your message. We've received your inquiry about "${message.substring(
    0,
    30
  )}...". We'll get back to you as soon as possible with more information. If you need immediate assistance, please don't hesitate to use the Airbnb messaging system. We hope you're enjoying your stay!`;
};

export default function Page() {
  const [expandedConversation, setExpandedConversation] = useState<
    number | null
  >(null);
  const [autoResponses, setAutoResponses] = useState<{ [key: number]: string }>(
    {}
  );
  const [isGenerating, setIsGenerating] = useState<{ [key: number]: boolean }>(
    {}
  );

  //   const handleGenerateResponse = async (
  //     conversationId: number,
  //     message: string
  //   ) => {
  //     setIsGenerating((prev) => ({ ...prev, [conversationId]: true }));
  //     const response = await generateAutoResponse(message);
  //     setAutoResponses((prev) => ({ ...prev, [conversationId]: response }));
  //     setIsGenerating((prev) => ({ ...prev, [conversationId]: false }));
  //   };

  const handleGenerateResponse = async (conversationId, lastMessage) => {
    // Set the loading state for the specific conversation
    setIsGenerating((prev) => ({ ...prev, [conversationId]: true }));

    try {
      // Send the request to the backend /csrBot API
      const response = await fetch("http://localhost:8000/csrBot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lastMessage: lastMessage }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);

      // Store the response in the autoResponses state
      setAutoResponses((prev) => ({
        ...prev,
        [conversationId]: data.documents, // Assuming the response from the API is in the "response" field
      }));
    } catch (error) {
      console.error("Failed to generate response:", error);
    } finally {
      // Remove the loading state
      setIsGenerating((prev) => ({ ...prev, [conversationId]: false }));
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Accommodation":
        return <Home className="h-6 w-6" />;
      case "Amenities":
        return <Utensils className="h-6 w-6" />;
      case "Local Tips":
        return <HelpCircle className="h-6 w-6" />;
      default:
        return <MessageSquare className="h-6 w-6" />;
    }
  };

  const totalUnreadCount = Object.values(unreadConversationsBySegment).flat()
    .length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Host Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(unreadConversationsBySegment).map(
            ([segment, conversations]) => (
              <Card
                key={segment}
                className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 border-none"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">
                    {segment}
                  </CardTitle>
                  {getCategoryIcon(segment)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {conversations.length}
                  </div>
                  <p className="text-xs text-gray-500">Unread messages</p>
                </CardContent>
              </Card>
            )
          )}
          <Card className="bg-[#FF5A5F] text-white shadow-sm hover:shadow-md transition-shadow duration-300 border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Unread
              </CardTitle>
              <BellRing className="h-6 w-6" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnreadCount}</div>
              <p className="text-xs text-white/80">Across all categories</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {Object.entries(unreadConversationsBySegment).map(
            ([segment, conversations]) => (
              <Card key={segment} className="bg-white shadow-sm border-none">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center">
                    {getCategoryIcon(segment)}
                    <span className="ml-2">{segment}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {conversations.map((conversation) => (
                      <AccordionItem
                        key={conversation.id}
                        value={`item-${conversation.id}`}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-medium">
                              {conversation.subject}
                            </span>
                            <Badge
                              variant="secondary"
                              className="ml-2 bg-[#FFB400] text-white"
                            >
                              Unread
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                From: {conversation.guest}
                              </p>
                              <p className="text-sm text-gray-600">
                                Received:{" "}
                                {new Date(
                                  conversation.timestamp
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md">
                              <div className="flex items-start">
                                <User className="h-5 w-5 mr-2 mt-1 text-gray-500" />
                                <p className="text-sm">
                                  {conversation.lastMessage}
                                </p>
                              </div>
                            </div>
                            {autoResponses[conversation.id] && (
                              <div className="bg-[#00A699]/10 p-4 rounded-md">
                                <div className="flex items-start">
                                  <Bot className="h-5 w-5 mr-2 mt-1 text-[#00A699]" />
                                  <p className="text-sm">
                                    {autoResponses[conversation.id]}
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="flex space-x-2">
                              <Button
                                onClick={() =>
                                  handleGenerateResponse(
                                    conversation.id,
                                    conversation.lastMessage
                                  )
                                }
                                className="flex-1 bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white"
                                disabled={isGenerating[conversation.id]}
                              >
                                {isGenerating[conversation.id]
                                  ? "Generating..."
                                  : autoResponses[conversation.id]
                                  ? "Regenerate Response"
                                  : "Generate Response"}
                              </Button>
                              {autoResponses[conversation.id] && (
                                <Button
                                  onClick={() =>
                                    handleGenerateResponse(
                                      conversation.id,
                                      conversation.lastMessage
                                    )
                                  }
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                                  disabled={isGenerating[conversation.id]}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
}
