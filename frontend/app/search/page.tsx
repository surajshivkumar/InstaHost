"use client";

import { useState } from "react";
import { Button } from "../components/ui-search/button";
import { Input } from "../components/ui-search/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui-search/card";
import { Dumbbell, Search, User } from "lucide-react";

// Mock data for conversations
const conversations = [
  {
    id: 1,
    member: "John Doe",
    topic: "Membership Renewal",
    content:
      "I'd like to renew my annual membership. Can you provide details on any current promotions?",
    date: "2023-05-15",
  },
  {
    id: 2,
    member: "Jane Smith",
    topic: "Personal Training",
    content:
      "I'm interested in starting personal training sessions. What are your trainer qualifications and rates?",
    date: "2023-05-16",
  },
  {
    id: 3,
    member: "Mike Johnson",
    topic: "Equipment Issue",
    content:
      "The treadmill in the cardio section (number 5) seems to be malfunctioning. It's making a loud noise when in use.",
    date: "2023-05-17",
  },
  {
    id: 4,
    member: "Sarah Williams",
    topic: "Class Schedule",
    content:
      "I noticed the yoga class schedule has changed. Can you confirm the new timings for the advanced class?",
    date: "2023-05-18",
  },
  {
    id: 5,
    member: "Chris Brown",
    topic: "Locker Room",
    content:
      "I left my watch in locker number 42 yesterday. Has it been turned in to lost and found?",
    date: "2023-05-19",
  },
];

export default function GymConversationSearchComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(conversations);

  const handleSearch = () => {
    const results = conversations.filter(
      (conversation) =>
        conversation.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.member.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <Dumbbell className="h-12 w-12 text-green-500 mr-2" />
          <h1 className="text-3xl font-bold text-center">
            Gym Conversation Search
          </h1>
        </div>

        <div className="flex space-x-2 mb-8">
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-gray-800 border-gray-700 text-white"
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
          {searchResults.map((conversation) => (
            <Card key={conversation.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-green-400">
                  <User className="h-5 w-5 mr-2" />
                  {conversation.member}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-2">
                  Topic: {conversation.topic}
                </p>
                <p className="text-gray-300">{conversation.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Date: {conversation.date}
                </p>
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
