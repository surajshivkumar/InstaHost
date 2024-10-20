"use client";

import { useState } from "react";
import { Card, CardContent } from "@/app/components/ui-customers/card";
import { Button } from "@/app/components/ui-customers/button";
import { Input } from "../components/ui-customers/input";
import { Badge } from "@/app/components/ui-customers/badge";
import { User, Search, Plus, BookOpen } from "lucide-react";

// Mock data for customers
const customers = [
  { id: 1, name: "John Doe", membershipType: "Gold", status: "Active" },
  { id: 2, name: "Jane Smith", membershipType: "Silver", status: "Active" },
  { id: 3, name: "Mike Johnson", membershipType: "Bronze", status: "Inactive" },
  { id: 4, name: "Emily Brown", membershipType: "Gold", status: "Active" },
  { id: 5, name: "Chris Wilson", membershipType: "Silver", status: "Active" },
  { id: 6, name: "Sarah Lee", membershipType: "Bronze", status: "Active" },
  { id: 7, name: "Tom Harris", membershipType: "Gold", status: "Inactive" },
  { id: 8, name: "Lucy Chen", membershipType: "Silver", status: "Active" },
  { id: 9, name: "David Kim", membershipType: "Bronze", status: "Active" },
  { id: 10, name: "Emma Watson", membershipType: "Gold", status: "Active" },
  {
    id: 11,
    name: "Robert Green",
    membershipType: "Silver",
    status: "Inactive",
  },
  { id: 12, name: "Olivia Taylor", membershipType: "Bronze", status: "Active" },
  { id: 13, name: "Daniel Brown", membershipType: "Gold", status: "Active" },
  {
    id: 14,
    name: "Sophia Martinez",
    membershipType: "Silver",
    status: "Active",
  },
  {
    id: 15,
    name: "William Johnson",
    membershipType: "Bronze",
    status: "Inactive",
  },
  { id: 16, name: "Ava Thompson", membershipType: "Gold", status: "Active" },
  { id: 17, name: "James Wilson", membershipType: "Silver", status: "Active" },
  {
    id: 18,
    name: "Isabella Garcia",
    membershipType: "Bronze",
    status: "Active",
  },
  {
    id: 19,
    name: "Benjamin Moore",
    membershipType: "Gold",
    status: "Inactive",
  },
  { id: 20, name: "Mia Anderson", membershipType: "Silver", status: "Active" },
];

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 text-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Customer List</h1>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-gray-200 border-gray-700 text-black"
            />
            <Button className="bg-green-600 hover:bg-green-700">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Customer
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="bg-gray-300 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 mr-2 text-red-800" />
                  <span className="font-semibold text-sm">{customer.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge
                    variant={
                      customer.status === "Active" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {customer.status}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {customer.membershipType}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <p className="text-center text-gray-400 mt-8">
            No customers found matching your search.
          </p>
        )}
      </div>
    </div>
  );
}
