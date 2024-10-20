"use client";

import { useState, useEffect } from "react";
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
import { User, Bot, RefreshCw, BellRing } from "lucide-react";

export default function Page() {
  const [conversations, setConversations] = useState([]);
  const [groupedConversations, setGroupedConversations] = useState({});
  const [autoResponses, setAutoResponses] = useState<{ [key: number]: string }>(
    {}
  );
  const [isGenerating, setIsGenerating] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch conversations from backend
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("http://localhost:8000/conversations");
        if (!response.ok) {
          throw new Error(
            `Error fetching conversations: ${response.statusText}`
          );
        }
        const data = await response.json(); // Assuming backend returns an array of conversations

        // Group conversations by subject
        const grouped = data.reduce((acc, conversation) => {
          const subject = conversation.subject;
          if (!acc[subject]) {
            acc[subject] = [];
          }
          acc[subject].push(conversation);
          return acc;
        }, {});

        setConversations(data);
        setGroupedConversations(grouped); // Save grouped conversations
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

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

  if (loading) {
    return <p>Loading conversations...</p>;
  }

  if (error) {
    return <p>Error loading conversations: {error}</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Host Dashboard
        </h1>

        {/* Render cards showing how many conversations in each category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(groupedConversations).map(
            ([subject, conversations]) => (
              <Card
                key={subject}
                className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 border-none"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">
                    {subject}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {conversations.length}
                  </div>
                  <p className="text-xs text-gray-500">Conversations</p>
                </CardContent>
              </Card>
            )
          )}
          <Card className="bg-[#FF5A5F] text-white shadow-sm hover:shadow-md transition-shadow duration-300 border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Conversations
              </CardTitle>
              <BellRing className="h-6 w-6" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversations.length}</div>
              <p className="text-xs text-white/80">Across all categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Render grouped conversations */}
        <div className="space-y-6">
          {Object.entries(groupedConversations).map(
            ([subject, conversations]) => (
              <div key={subject}>
                <h2 className="text-2xl font-bold mb-4">{subject}</h2>

                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className="bg-white shadow-sm border-none"
                  >
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">
                        {`ROOM ${Math.floor(100 + Math.random() * 900)}`}{" "}
                        {/* Generates a random 3-digit room number */}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={`item-${conversation.id}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-medium">
                                {conversation.guest}
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
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
