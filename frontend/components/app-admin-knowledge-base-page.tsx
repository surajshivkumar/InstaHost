'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Save, Trash2, Search, Edit } from 'lucide-react'
import { toast } from "@/app/components/ui-admin/use-toast"

// Mock initial knowledge base data
const initialKnowledgeBase = Array(20).fill(null).map((_, index) => ({
  id: index + 1,
  category: ['Policies', 'Rules', 'FAQs', 'Amenities', 'Local Information'][Math.floor(Math.random() * 5)],
  title: `Entry ${index + 1}`,
  content: `This is the content for entry ${index + 1}. It contains important information about our policies, rules, or frequently asked questions.`
}))

const categories = ['Policies', 'Rules', 'FAQs', 'Amenities', 'Local Information']

export function Page() {
  const [knowledgeBase, setKnowledgeBase] = useState(initialKnowledgeBase)
  const [newEntry, setNewEntry] = useState({ category: '', title: '', content: '' })
  const [editingEntry, setEditingEntry] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredKnowledgeBase = knowledgeBase.filter(entry =>
    (selectedCategory === 'All' || entry.category === selectedCategory) &&
    (entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     entry.content.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAddEntry = () => {
    if (newEntry.category && newEntry.title && newEntry.content) {
      setKnowledgeBase([...knowledgeBase, { ...newEntry, id: Date.now() }])
      setNewEntry({ category: '', title: '', content: '' })
      toast({
        title: "Entry Added",
        description: "New knowledge base entry has been added successfully.",
      })
    } else {
      toast({
        title: "Error",
        description: "Please fill in all fields before adding a new entry.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateEntry = () => {
    if (editingEntry) {
      setKnowledgeBase(knowledgeBase.map(entry =>
        entry.id === editingEntry.id ? editingEntry : entry
      ))
      setEditingEntry(null)
      toast({
        title: "Entry Updated",
        description: "Knowledge base entry has been updated successfully.",
      })
    }
  }

  const handleDeleteEntry = (id: number) => {
    setKnowledgeBase(knowledgeBase.filter(entry => entry.id !== id))
    toast({
      title: "Entry Deleted",
      description: "Knowledge base entry has been deleted successfully.",
    })
  }

  const handleSaveKnowledgeBase = () => {
    console.log('Saving knowledge base:', knowledgeBase)
    toast({
      title: "Knowledge Base Saved",
      description: "All changes have been saved successfully.",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-[#FF5A5F]">Knowledge Base Editor</h1>

        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-1/3 relative">
            <Input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-1/3">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add New Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Select
                  value={newEntry.category}
                  onValueChange={(value) => setNewEntry({...newEntry, category: value})}
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
                <Input
                  placeholder="Entry title"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                />
                <Textarea
                  placeholder="Entry content"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                  rows={4}
                />
                <Button onClick={handleAddEntry} className="w-full bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white">
                  Add Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKnowledgeBase.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.title}</TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setEditingEntry(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Entry</DialogTitle>
                          </DialogHeader>
                          {editingEntry && (
                            <div className="space-y-4 mt-4">
                              <Select
                                value={editingEntry.category}
                                onValueChange={(value) => setEditingEntry({...editingEntry, category: value})}
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
                              <Input
                                value={editingEntry.title}
                                onChange={(e) => setEditingEntry({...editingEntry, title: e.target.value})}
                              />
                              <Textarea
                                value={editingEntry.content}
                                onChange={(e) => setEditingEntry({...editingEntry, content: e.target.value})}
                                rows={4}
                              />
                              <Button onClick={handleUpdateEntry} className="w-full bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white">
                                Update Entry
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Button onClick={handleSaveKnowledgeBase} className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white">
          <Save className="mr-2 h-4 w-4" /> Save Knowledge Base
        </Button>
      </div>
    </div>
  )
}