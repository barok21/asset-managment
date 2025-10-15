"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, AlertCircle, CheckCircle } from "lucide-react"

type PropertyItem = {
  id: string
  property_name: string
}

type RequestGroup = {
  request_batch_id: string
  department: string
  requestor_full_name: string
  created_at: string
  return_date: string
  properties: PropertyItem[]
}

export default function RequestEvaluationForm({ onClose, request, evaluatorName }: { onClose: () => void; request: RequestGroup; evaluatorName?: string }) {
  const criteria = [
    { id: "advance_booking", name: "Advance Booking", description: "Did they request the item in advance?", weight: 0.3, category: "Accountability" },
    { id: "on_time_collection", name: "On-time Collection", description: "Did they collect it on time?", weight: 0.3, category: "Accountability" },
    { id: "proper_use", name: "Proper Use", description: "Did they use it properly?", weight: 0.25, category: "Resource Care" },
    { id: "intended_purpose", name: "Intended Purpose", description: "Was it used for its intended purpose?", weight: 0.25, category: "Resource Care" },
    { id: "on_time_return", name: "On-time Return", description: "Was it returned on time?", weight: 0.2, category: "Efficiency" },
    { id: "clean_return", name: "Clean Return", description: "Was it returned clean and intact?", weight: 0.2, category: "Efficiency" },
    { id: "no_damage", name: "No Damage", description: "No damage reported?", weight: 0.15, category: "Responsibility" },
  ]

  const [formData, setFormData] = useState({
    department: request.department || "",
    evaluator: evaluatorName || "",
    date: new Date().toISOString().split("T")[0],
    resource: request.properties.map(p => p.property_name).join(", "),
    notes: "",
  })

  const [scores, setScores] = useState<Record<string, number>>({})
  const [penalties, setPenalties] = useState({
    lateReturn: false,
    unreportedLoss: false,
    wastedConsumables: false,
  })

  const handleScoreChange = (criteriaId: string, score: number) => {
    setScores((prev) => ({ ...prev, [criteriaId]: score }))
  }

  const calculateTotalScore = () => {
    const totalPossible = criteria.length * 5
    const actualScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
    let percentage = (actualScore / totalPossible) * 100
    if (penalties.lateReturn) percentage -= 2
    if (penalties.unreportedLoss) percentage -= 3
    if (penalties.wastedConsumables) percentage -= 3
    return Math.max(0, percentage)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const evaluation = {
      id: Date.now().toString(),
      request_batch_id: request.request_batch_id,
      department: formData.department,
      evaluator: formData.evaluator,
      date: formData.date,
      resources: request.properties,
      notes: formData.notes,
      scores,
      penalties,
      totalScore: calculateTotalScore(),
      timestamp: new Date().toISOString(),
    }

    const key = "request_evaluations"
    const existing = JSON.parse(localStorage.getItem(key) || "[]")
    existing.push(evaluation)
    localStorage.setItem(key, JSON.stringify(existing))

    const dataStr = JSON.stringify(evaluation, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `evaluation_${request.request_batch_id}_${formData.date}.json`
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    onClose()
  }

  const totalScore = calculateTotalScore()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Evaluate Request</CardTitle>
              <CardDescription>
                Batch: {request.request_batch_id} • Dept: {request.department}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={formData.department} readOnly className="bg-muted" />
                </div>

                <div>
                  <Label htmlFor="resource">Resources Used</Label>
                  <Input id="resource" value={formData.resource} readOnly className="bg-muted" />
                </div>

                <div>
                  <Label htmlFor="evaluator">Evaluator</Label>
                  <Input
                    id="evaluator"
                    value={formData.evaluator}
                    onChange={(e) => setFormData((prev) => ({ ...prev, evaluator: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <Label htmlFor="date">Evaluation Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Evaluation Criteria</h3>
                <div className="space-y-4">
                  {criteria.map((criterion) => (
                    <div key={criterion.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{criterion.name}</h4>
                          <p className="text-sm text-muted-foreground">{criterion.description}</p>
                        </div>
                        <Badge variant="outline">{criterion.category}</Badge>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          {[1,2,3,4,5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => handleScoreChange(criterion.id, n)}
                              className={`w-8 h-8 rounded border text-sm ${
                                (scores[criterion.id] || 0) >= n ? "bg-primary text-primary-foreground" : "bg-background"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Penalties (if applicable)</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={penalties.lateReturn}
                      onChange={(e) => setPenalties((prev) => ({ ...prev, lateReturn: e.target.checked }))}
                      className="rounded"
                    />
                    <div>
                      <span className="font-medium">Late Return (-2 points)</span>
                      <p className="text-sm text-muted-foreground">Returned more than 12 hours late</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={penalties.unreportedLoss}
                      onChange={(e) => setPenalties((prev) => ({ ...prev, unreportedLoss: e.target.checked }))}
                      className="rounded"
                    />
                    <div>
                      <span className="font-medium">Unreported Loss/Damage (-3 points)</span>
                      <p className="text-sm text-muted-foreground">Failed to report damage or missing items</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={penalties.wastedConsumables}
                      onChange={(e) => setPenalties((prev) => ({ ...prev, wastedConsumables: e.target.checked }))}
                      className="rounded"
                    />
                    <div>
                      <span className="font-medium">Wasted Consumables (-3 points)</span>
                      <p className="text-sm text-muted-foreground">Excessive waste of markers, paper, etc.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total Score:</span>
                  <div className="flex items-center gap-2">
                    {totalScore >= 90 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : totalScore >= 70 ? (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-2xl font-bold">{totalScore.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional observations or comments..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Submit Evaluation</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


