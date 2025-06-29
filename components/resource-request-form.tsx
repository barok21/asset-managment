"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { X, FileText, Send, Plus, Trash2 } from "lucide-react"
// import { useAuth } from "@/hooks/use-auth"

interface ResourceRequestFormProps {
  onClose: () => void
}

const resourceTypes = [
  { id: "sound_system", name: "Sound System", category: "Audio/Visual" },
  { id: "projector", name: "Projector", category: "Audio/Visual" },
  { id: "microphone", name: "Microphone", category: "Audio/Visual" },
  { id: "chairs", name: "Chairs", category: "Furniture" },
  { id: "tables", name: "Tables", category: "Furniture" },
  { id: "classroom", name: "Classroom", category: "Space" },
  { id: "hall", name: "Main Hall", category: "Space" },
  { id: "kitchen", name: "Kitchen Facilities", category: "Space" },
  { id: "books", name: "Books/Materials", category: "Educational" },
  { id: "markers", name: "Markers/Supplies", category: "Educational" },
  { id: "decorations", name: "Decorations", category: "Event" },
  { id: "candles", name: "Candles", category: "Liturgical" },
]

const timeSlots = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
  "8:00 PM - 10:00 PM",
]

export default function ResourceRequestForm() {
  // const { user } = useAuth()

  const [formData, setFormData] = useState({
    // requesterName: user?.name || "",
    // department: user?.department || "",
    contactInfo: "",
    requestDate: new Date().toISOString().split("T")[0],
    eventDate: "",
    eventTime: "",
    duration: "",
    purpose: "",
    specialRequirements: "",
    setupRequirements: "",
    returnDate: "",
    alternativeDate: "",
  })

  const [selectedResources, setSelectedResources] = useState<
    Array<{
      id: string
      type: string
      quantity: number
      notes: string
      status: "pending"
    }>
  >([])

  const [newResource, setNewResource] = useState({
    type: "",
    quantity: 1,
    notes: "",
  })

  const addResource = () => {
    if (!newResource.type) {
      alert("Please select a resource type")
      return
    }

    const resource = {
      id: Date.now().toString(),
      ...newResource,
      status: "pending" as const,
    }

    // Add new resource at the beginning of the array
    setSelectedResources([resource, ...selectedResources])

    // Reset the form
    setNewResource({
      type: "",
      quantity: 1,
      notes: "",
    })
  }

  const removeResource = (id: string) => {
    setSelectedResources(selectedResources.filter((resource) => resource.id !== id))
  }

  const updateResource = (id: string, field: string, value: string | number) => {
    const updated = selectedResources.map((resource) =>
      resource.id === id ? { ...resource, [field]: value } : resource,
    )
    setSelectedResources(updated)
  }

  const getResourceName = (resourceId: string) => {
    const resource = resourceTypes.find((r) => r.id === resourceId)
    return resource ? `${resource.name} (${resource.category})` : resourceId
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedResources.length === 0) {
      alert("Please add at least one resource to your request")
      return
    }

    const request = {
      id: Date.now().toString(),
      ...formData,
      resources: selectedResources,
      status: "pending",
      submittedAt: new Date().toISOString(),
      // requesterId: user?.id,
      priority: "normal",
    }

    // Save to localStorage (in a real app, this would be sent to a database)
    const existingRequests = JSON.parse(localStorage.getItem("resource_requests") || "[]")
    existingRequests.push(request)
    localStorage.setItem("resource_requests", JSON.stringify(existingRequests))

    // Download as JSON file for record keeping
    const dataStr = JSON.stringify(request, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    // const exportFileDefaultName = `resource_request_${formData.department}_${formData.requestDate}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    // linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    alert("Resource request submitted successfully!")
    
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resource Request Form
              </CardTitle>
              <CardDescription>Request church resources for your ministry activities</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Requester Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Requester Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="requesterName">Full Name *</Label>
                    <Input
                      id="requesterName"
                      // value={formData.requesterName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, requesterName: e.target.value }))}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">Department/Ministry *</Label>
                    <Select
                      // value={formData.department}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="choir">Choir</SelectItem>
                        <SelectItem value="bible-study">Bible Study</SelectItem>
                        <SelectItem value="youth-ministry">Youth Ministry</SelectItem>
                        <SelectItem value="sunday-school">Sunday School</SelectItem>
                        <SelectItem value="womens-ministry">Women's Ministry</SelectItem>
                        <SelectItem value="mens-ministry">Men's Ministry</SelectItem>
                        <SelectItem value="deacons">Deacons</SelectItem>
                        <SelectItem value="priests">Priests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="contactInfo">Contact Information *</Label>
                    <Input
                      id="contactInfo"
                      value={formData.contactInfo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contactInfo: e.target.value }))}
                      placeholder="Phone number or email"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="requestDate">Request Date</Label>
                    <Input
                      id="requestDate"
                      type="date"
                      value={formData.requestDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, requestDate: e.target.value }))}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="eventDate">Event Date *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, eventDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="eventTime">Event Time *</Label>
                    <Select
                      value={formData.eventTime}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, eventTime: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot, index) => (
                          <SelectItem key={index} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (hours) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="12"
                      value={formData.duration}
                      onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                      placeholder="Number of hours"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="returnDate">Expected Return Date *</Label>
                    <Input
                      id="returnDate"
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, returnDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Resource Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Add Resources</h3>

                {/* Add New Resource Form */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-2">
                      <Label className="text-sm">Resource Type *</Label>
                      <Select
                        value={newResource.type}
                        onValueChange={(value) => setNewResource((prev) => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select resource" />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceTypes.map((resourceType) => (
                            <SelectItem key={resourceType.id} value={resourceType.id}>
                              {resourceType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newResource.quantity}
                        onChange={(e) =>
                          setNewResource((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) || 1 }))
                        }
                        className="h-9"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Notes</Label>
                      <Input
                        value={newResource.notes}
                        onChange={(e) => setNewResource((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional..."
                        className="h-9"
                      />
                    </div>

                    <div>
                      <Button type="button" onClick={addResource} className="h-9 w-full">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Resources Table */}
                {selectedResources.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium text-sm">Resource</th>
                          <th className="text-left p-3 font-medium text-sm w-24">Qty</th>
                          <th className="text-left p-3 font-medium text-sm">Notes</th>
                          <th className="text-left p-3 font-medium text-sm w-20">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResources.map((resource) => (
                          <tr key={resource.id} className="border-t hover:bg-muted/30">
                            <td className="p-3">
                              <div className="font-medium text-sm">{getResourceName(resource.type)}</div>
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="1"
                                value={resource.quantity}
                                onChange={(e) =>
                                  updateResource(resource.id, "quantity", Number.parseInt(e.target.value) || 1)
                                }
                                className="w-16 h-8 text-center text-sm"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                value={resource.notes}
                                onChange={(e) => updateResource(resource.id, "notes", e.target.value)}
                                placeholder="Optional notes..."
                                className="h-8 text-sm"
                              />
                            </td>
                            <td className="p-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeResource(resource.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedResources.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg bg-muted/20">
                    <p className="text-sm">No resources added yet. Use the form above to add resources.</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="purpose">Purpose/Event Description *</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Describe the purpose and nature of your event..."
                  rows={2}
                  required
                />
              </div>

              <div>
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData((prev) => ({ ...prev, specialRequirements: e.target.value }))}
                  placeholder="Any special setup, technical requirements, or considerations..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="alternativeDate">Alternative Date (if primary date unavailable)</Label>
                <Input
                  id="alternativeDate"
                  type="date"
                  value={formData.alternativeDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, alternativeDate: e.target.value }))}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="submit" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
