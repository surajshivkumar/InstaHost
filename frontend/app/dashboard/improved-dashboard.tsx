"use client";

import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Search, Bell, Users, MessageSquare, Clock } from "lucide-react";

// Mock data for unread conversations
const unreadConversations = [
  {
    id: 1,
    customer: "John Doe",
    message: "I haven't received my order yet.",
    timestamp: "2023-05-10T09:00:00Z",
  },
  {
    id: 2,
    customer: "Jane Smith",
    message: "How do I return an item?",
    timestamp: "2023-05-10T10:30:00Z",
  },
  {
    id: 3,
    customer: "Bob Johnson",
    message: "My product is defective.",
    timestamp: "2023-05-10T11:45:00Z",
  },
];

// Mock data for segmentation topics
const segmentationData = [
  { name: "Shipping Issues", value: 35 },
  { name: "Product Quality", value: 28 },
  { name: "Returns", value: 22 },
  { name: "Billing", value: 15 },
  { name: "General Inquiries", value: 40 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function ImprovedDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [autoReplyMessage, setAutoReplyMessage] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to the search page with the query as a URL parameter
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleAutoReply = (conversationId: number) => {
    // Implement auto-reply functionality here
    console.log(
      "Sending auto-reply to conversation:",
      conversationId,
      "Message:",
      autoReplyMessage
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Customer Service Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
            <Button onClick={handleSearchSubmit}>Search</Button>
            <Bell className="text-primary-foreground" size={24} />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Segmentation Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segmentationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {segmentationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +5.2% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Open Tickets
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">
                -12% from last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.5 hours</div>
              <p className="text-xs text-muted-foreground">
                -30 minutes from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Unread Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {unreadConversations.map((conversation) => (
                  <li key={conversation.id} className="border-b pb-4">
                    <h3 className="font-semibold">{conversation.customer}</h3>
                    <p className="text-sm text-gray-600">
                      {conversation.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(conversation.timestamp).toLocaleString()}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Auto-reply message"
                        value={autoReplyMessage}
                        onChange={(e) => setAutoReplyMessage(e.target.value)}
                        className="flex-grow"
                      />
                      <Button onClick={() => handleAutoReply(conversation.id)}>
                        Send
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
