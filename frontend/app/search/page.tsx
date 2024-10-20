"use client";

import { useState, useEffect } from "react";
import { Button } from "../components/ui-search/button";
import { Input } from "../components/ui-search/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui-search/card";
import { Hotel, Search, User, ChevronDown, ChevronUp } from "lucide-react";

export default function GymConversationSearchComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(
    null
  );

  // Retrieve conversation data from session storage
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const results = sessionStorage.getItem("searchResults");
        console.log(results);
        if (!results) {
          throw new Error("No search results found in session storage.");
        }

        // Parse the results from session storage
        const conversations = JSON.parse(results);

        setSearchResults(conversations);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const handleSearch = () => {
    const filteredResults = searchResults.filter(
      (conversation) =>
        conversation.customerName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        conversation.customerEmail
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        conversation.agentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(filteredResults);
  };

  const toggleExpand = (index: number) => {
    setExpandedCardIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  if (loading) {
    return <p>Loading conversations...</p>;
  }

  if (error) {
    return <p>Error loading conversations: {error}</p>;
  }

  return (
    <div className="min-h-screen bg-gray-20 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <Hotel className="h-12 w-12 text-green-500 mr-2" />
          <h1 className="text-3xl font-bold text-center">
            Ember Sands Customer Conversation Search
          </h1>
        </div>

        <div className="flex space-x-2 mb-8">
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-gray-200 border-gray-700 text-black"
          />
          <Button
            onClick={handleSearch}
            className="bg-green-600 hover:bg-green-700"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        <div className="space-y-4">
          {searchResults.map((conversation, index) => (
            <Card key={index} className="bg-gray-900 border-gray-700">
              <CardHeader
                onClick={() => toggleExpand(index)}
                className="cursor-pointer"
              >
                <CardTitle className="flex items-center justify-between text-green-400">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {conversation.customerName}
                  </div>
                  {expandedCardIndex === index ? (
                    <ChevronUp />
                  ) : (
                    <ChevronDown />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-2">
                  Phone: {conversation.customerPhone}
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  Email: {conversation.customerEmail}
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  Agent: {conversation.agentName}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Date: {conversation.date}
                </p>

                {expandedCardIndex === index && (
                  <div className="mt-4">
                    <h4 className="font-bold mb-2 text-gray-50">
                      Conversation:
                    </h4>
                    <div className="text-gray-300">
                      {conversation.fullConversation.map(
                        (entry: any, i: number) => (
                          <p key={i}>
                            <strong>{entry.speaker}:</strong> {entry.message}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {searchResults.length === 0 && (
            <p className="text-center text-gray-400">
              No conversations found matching your search term.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
