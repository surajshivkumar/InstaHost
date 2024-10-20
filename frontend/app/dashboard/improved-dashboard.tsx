"use client";

import { useState } from "react";
import { Button } from "../components/ui-dashboard/button";
import { Input } from "../components/ui-dashboard/input";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui-dashboard/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Search, Bell, Sun, Users, MessageSquare, Clock } from "lucide-react";

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
  { name: "Service Quality", value: 35 },
  { name: "Cleanliness", value: 28 },
  { name: "Food and Amenities", value: 22 },
  { name: "Noise and Privacy", value: 15 },
  { name: "Check-in and Check-out", value: 40 },
  { name: "Price", value: 40 },
  { name: "Other", value: 40 },
];

const COLORS = [
  "#091057", // Dark Blue
  "#EC8305", // Charcoal
  "#F95454", // Dark Olive Green
  "#AB886D", // Dark Slate Gray
  "#387478", // Dark Purple
  "#72BF78", // Dark Brown
  "#7E60BF", // Dark Slate Gray (alternative)
];

export function ImprovedDashboard() {
  const [autoReplyMessage, setAutoReplyMessage] = useState("");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: searchQuery }), // Send the search query to the backend
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();

      // Log the data received from the backend
      console.log("Search results:", data);

      // Navigate to a new page (e.g., /search-results) and pass the data through query params or session storage
      sessionStorage.setItem("searchResults", JSON.stringify(data.documents));
      router.push("/search"); // Redirect to search-results page
    } catch (err) {
      setError(`Failed to search: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Sun className="h-8 w-8 mr-2" />
          {""}
          {/* Add the icon with some spacing */}
          <h1 className="text-2xl font-bold">Ember Sands</h1>
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
                  {/* <Legend /> */}
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Link href="/customers">
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
          </Link>
          <Link href="/conversations">
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
          </Link>
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

        <div className="grid grid-cols-1 gap-6"></div>
      </main>
    </div>
  );
}
