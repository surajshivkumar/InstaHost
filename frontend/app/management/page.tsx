"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui-admin/card";
import { Button } from "@/app/components/ui-admin/button";
import { Input } from "@/app/components/ui-admin/input";
import { Textarea } from "@/app/components/ui-admin/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui-admin/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui-admin/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui-admin/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui-admin/sheet";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/app/components/ui-admin/alert";
import { Plus, Trash2, Search, Edit, AlertCircle } from "lucide-react";
import axios from "axios";
// import { toast } from "@/app/components/ui-admin/use-toast";

// Define the Policy type
interface Policy {
  id: number;
  category: string;
  title: string;
  content: string;
}

const categories = [
  "Policies",
  "Rules",
  "FAQs",
  "Amenities",
  "Local Information",
];

export default function Page() {
  const [knowledgeBase, setKnowledgeBase] = useState<Policy[]>([]);
  const [newEntry, setNewEntry] = useState({
    category: "",
    title: "",
    content: "",
  });
  const [editingEntry, setEditingEntry] = useState<Policy | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [alert, setAlert] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
  });
  const [loading, setLoading] = useState(false);

  // Fetch policies on component mount
  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/policies");
      setKnowledgeBase(response.data);
    } catch (error) {
      console.error("Error fetching policies:", error);
      showAlert(
        "Error",
        "Failed to fetch policies. Please try again later.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Show alert
  const showAlert = (title: string, message: string, type: string = "info") => {
    setAlert({ show: true, title, message, type });
    setTimeout(
      () => setAlert({ show: false, title: "", message: "", type: "info" }),
      3000
    );
  };

  // Handle adding a new entry
  const handleAddEntry = async () => {
    if (newEntry.category && newEntry.title && newEntry.content) {
      try {
        const response = await axios.post("/api/policies", newEntry);
        setKnowledgeBase([...knowledgeBase, response.data]);
        setNewEntry({ category: "", title: "", content: "" });
        showAlert(
          "Entry Added",
          "New knowledge base entry has been added successfully.",
          "success"
        );
      } catch (error) {
        console.error("Error adding policy:", error);
        showAlert(
          "Error",
          "Failed to add new entry. Please try again.",
          "error"
        );
      }
    } else {
      showAlert(
        "Error",
        "Please fill in all fields before adding a new entry.",
        "error"
      );
    }
  };

  // Handle updating an existing entry
  const handleUpdateEntry = async () => {
    if (editingEntry) {
      try {
        const response = await axios.put(
          `/api/policies/${editingEntry.id}`,
          {
            category: editingEntry.category, // Ensure 'category' is included
            title: editingEntry.title,
            content: editingEntry.content, // Ensure 'content' is included
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setKnowledgeBase(
          knowledgeBase.map((entry) =>
            entry.id === editingEntry.id ? response.data : entry
          )
        );
        setEditingEntry(null);
        showAlert(
          "Entry Updated",
          "Knowledge base entry has been updated successfully.",
          "success"
        );
      } catch (error: any) {
        console.error("Error updating policy:", error);
        const errorMessage =
          error.response?.data?.error || "Failed to update entry.";
        showAlert("Error", errorMessage, "error");
      }
    }
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        const response = await axios.delete(`/api/policies/${id}`);

        if (response.status === 204) {
          setKnowledgeBase(knowledgeBase.filter((entry) => entry.id !== id));
          setAlert({
            show: true,
            title: "Success",
            message: "Entry deleted successfully",
            type: "success",
          });
        } else {
          throw new Error("Failed to delete entry");
        }
      } catch (error: any) {
        console.error("Error deleting policy:", error);
        setAlert({
          show: true,
          title: "Error",
          message:
            error.response?.data?.error ||
            "Failed to delete entry. Please try again.",
          type: "error",
        });
      }
    }
  };

  // Removed the handleSaveKnowledgeBase function since CRUD operations are handled individually

  // Filter knowledge base based on search term
  const filteredKnowledgeBase = knowledgeBase.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const pageCount = Math.ceil(filteredKnowledgeBase.length / itemsPerPage);
  const currentEntries = filteredKnowledgeBase.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-[#FF5A5F]">
          Knowledge Base Editor
        </h1>

        {alert.show && (
          <Alert
            className={`mb-4 ${
              alert.type === "error"
                ? "bg-red-100 border-red-400"
                : "bg-green-100 border-green-400"
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <div className="mb-8 flex justify-between items-center">
          {/* Search Bar */}
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>

          {/* Add New Entry Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add New Entry
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add New Entry</SheetTitle>
                <SheetDescription>
                  Fill in the details for the new knowledge base entry.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                {/* Category Select */}
                <Select
                  value={newEntry.category}
                  onValueChange={(value) =>
                    setNewEntry({ ...newEntry, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Title Input */}
                <Input
                  placeholder="Entry title"
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                />

                {/* Content Textarea */}
                <Textarea
                  placeholder="Entry content"
                  value={newEntry.content}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, content: e.target.value })
                  }
                  rows={4}
                />

                {/* Add Entry Button */}
                <Button
                  onClick={handleAddEntry}
                  className="w-full bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white"
                >
                  Add Entry
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Tabs for Categories */}
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {["all", ...categories].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <p className="text-center py-4">Loading...</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentEntries
                          .filter(
                            (entry) => tab === "all" || entry.category === tab
                          )
                          .map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{entry.title}</TableCell>
                              <TableCell>{entry.category}</TableCell>
                              <TableCell className="flex space-x-2">
                                {/* Edit Entry */}
                                <Sheet>
                                  <SheetTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingEntry(entry)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </SheetTrigger>
                                  <SheetContent>
                                    <SheetHeader>
                                      <SheetTitle>Edit Entry</SheetTitle>
                                      <SheetDescription>
                                        Modify the details of the knowledge base
                                        entry.
                                      </SheetDescription>
                                    </SheetHeader>
                                    {editingEntry &&
                                      editingEntry.id === entry.id && (
                                        <div className="space-y-4 mt-4">
                                          {/* Category Select */}
                                          <Select
                                            value={editingEntry.category}
                                            onValueChange={(value) =>
                                              setEditingEntry({
                                                ...editingEntry,
                                                category: value,
                                              })
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {categories.map((category) => (
                                                <SelectItem
                                                  key={category}
                                                  value={category}
                                                >
                                                  {category}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>

                                          {/* Title Input */}
                                          <Input
                                            placeholder="Entry title"
                                            value={editingEntry.title}
                                            onChange={(e) =>
                                              setEditingEntry({
                                                ...editingEntry,
                                                title: e.target.value,
                                              })
                                            }
                                          />

                                          {/* Content Textarea */}
                                          <Textarea
                                            placeholder="Entry content"
                                            value={editingEntry.content}
                                            onChange={(e) =>
                                              setEditingEntry({
                                                ...editingEntry,
                                                content: e.target.value,
                                              })
                                            }
                                            rows={4}
                                          />

                                          {/* Update Entry Button */}
                                          <Button
                                            onClick={handleUpdateEntry}
                                            className="w-full bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white"
                                          >
                                            Update Entry
                                          </Button>
                                        </div>
                                      )}
                                  </SheetContent>
                                </Sheet>

                                {/* Delete Entry */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEntry(entry.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Pagination Controls */}
        <div className="mt-4 flex justify-between items-center">
          <div className="space-x-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, pageCount))
              }
              disabled={currentPage === pageCount}
            >
              Next
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Page {currentPage} of {pageCount}
          </p>
        </div>

        {/* Removed the Save Knowledge Base Button since CRUD operations are handled individually */}
      </div>
    </div>
  );
}
