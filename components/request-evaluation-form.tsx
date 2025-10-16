"use client"

import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, AlertCircle, CheckCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { createEvaluation, listEvaluationsByBatch, updateEvaluation, updateEvaluationByBatch } from "@/lib/actions/property.action"
import type { CreateEvaluationInput, EvaluationRecord } from "@/types"

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
  const [resourceUsage, setResourceUsage] = useState<Record<string, { used: number; returned: number }>>({})
  const [existingEvaluation, setExistingEvaluation] = useState<EvaluationRecord | null>(null)
  const [viewMode, setViewMode] = useState(false)
  const [isPending, startTransition] = useTransition()

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

  useEffect(() => {
    const initial: Record<string, { used: number; returned: number }> = {}
    request.properties.forEach((p) => {
      initial[p.id] = { used: 0, returned: 0 }
    })
    setResourceUsage(initial)
  }, [request.properties])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        console.log("Loading evaluations for batch:", request.request_batch_id);
        const list = await listEvaluationsByBatch(request.request_batch_id)
        console.log("Found evaluations:", list);
        
        if (!active || !list || list.length === 0) {
          console.log("No existing evaluations found");
          return
        }
        
        const latest = list[0]
        console.log("Loading latest evaluation:", latest);
        console.log("Latest evaluation ID:", latest.id);
        console.log("Latest evaluation ID type:", typeof latest.id);
        
        setExistingEvaluation(latest)
        setFormData((prev) => ({
          ...prev,
          department: latest.department || prev.department,
          evaluator: latest.evaluator || prev.evaluator,
          date: latest.date || prev.date,
          notes: latest.notes || "",
        }))
        setScores(latest.scores as Record<string, number> || {})
        setPenalties(latest.penalties as any || {
          lateReturn: false,
          unreportedLoss: false,
          wastedConsumables: false,
        })
        
        if (Array.isArray(latest.resources)) {
          const ru: Record<string, { used: number; returned: number }> = {}
          ;(latest.resources as any[]).forEach((r: any) => {
            ru[r.id] = { used: r.used_quantity || 0, returned: r.returned_quantity || 0 }
          })
          setResourceUsage((prev) => ({ ...prev, ...ru }))
        }
        setViewMode(true)
        console.log("Evaluation loaded successfully");
      } catch (e) {
        console.log("No existing evaluation found or error loading:", e);
      }
    })()
    return () => {
      active = false
    }
  }, [request.request_batch_id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form data:", formData);
    console.log("Scores:", scores);
    console.log("Penalties:", penalties);
    console.log("Resource usage:", resourceUsage);
    console.log("Calculated total score:", calculateTotalScore());
    
    const payload: CreateEvaluationInput = {
      request_batch_id: request.request_batch_id,
      department: formData.department,
      evaluator: formData.evaluator,
      date: formData.date,
      resources: request.properties.map(p => ({
        id: p.id,
        property_name: p.property_name,
        used_quantity: Number(resourceUsage[p.id]?.used || 0),
        returned_quantity: Number(resourceUsage[p.id]?.returned || 0),
      })),
      notes: formData.notes,
      scores,
      penalties,
      totalScore: calculateTotalScore(),
    }
    
    console.log("Final payload:", JSON.stringify(payload, null, 2));
    console.log("=== END FORM DEBUG ===");

    startTransition(async () => {
      try {
        console.log("Form submission started");
        console.log("Existing evaluation:", existingEvaluation);
        console.log("View mode:", viewMode);
        console.log("Payload:", payload);
        
        if (existingEvaluation) {
          if (viewMode) {
            toast.info("Viewing existing evaluation. Click Edit to modify.")
            return
          } else {
            console.log("=== EVALUATION UPDATE DEBUG ===");
            console.log("Existing evaluation object:", existingEvaluation);
            console.log("Evaluation ID:", existingEvaluation.id);
            console.log("ID type:", typeof existingEvaluation.id);
            console.log("ID length:", existingEvaluation.id?.length);
            console.log("Request batch ID:", request.request_batch_id);
            console.log("=== END EVALUATION UPDATE DEBUG ===");
            
            // Try the new update by batch ID method first
            try {
              await updateEvaluationByBatch(request.request_batch_id, payload)
              console.log("Update by batch ID successful");
            } catch (batchError) {
              console.log("Update by batch ID failed, trying by evaluation ID:", batchError);
              await updateEvaluation(existingEvaluation.id, payload)
            }
            toast.success("Evaluation updated successfully")
          }
        } else {
          console.log("Creating new evaluation");
          await createEvaluation(payload)
          toast.success("Evaluation submitted successfully")
        }
        onClose()
      } catch (err) {
        console.error("Evaluation submission error:", err)
        toast.error("Failed to submit evaluation. Please try again.")
      }
    })
  }

  const totalScore = calculateTotalScore()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
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

                <div className="md:col-span-2">
                  <Label>Resources Used</Label>
                  <div className="mt-2">
                    {/* Mobile-friendly card layout */}
                    <div className="block sm:hidden space-y-3">
                      {request.properties.map((p) => (
                        <Card key={p.id} className="p-4">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium">{p.property_name}</Label>
                              <p className="text-xs text-muted-foreground">
                                Approved: {(p as any).approved_quantity ?? (p as any).quantity ?? "-"}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`used-${p.id}`} className="text-xs">Used</Label>
                                <Input
                                  id={`used-${p.id}`}
                                  type="number"
                                  value={resourceUsage[p.id]?.used ?? 0}
                                  onChange={(e) =>
                                    setResourceUsage((prev) => ({
                                      ...prev,
                                      [p.id]: {
                                        used: Number(e.target.value),
                                        returned: prev[p.id]?.returned ?? 0,
                                      },
                                    }))
                                  }
                                  disabled={viewMode}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`returned-${p.id}`} className="text-xs">Returned</Label>
                                <Input
                                  id={`returned-${p.id}`}
                                  type="number"
                                  value={resourceUsage[p.id]?.returned ?? 0}
                                  onChange={(e) =>
                                    setResourceUsage((prev) => ({
                                      ...prev,
                                      [p.id]: {
                                        used: prev[p.id]?.used ?? 0,
                                        returned: Number(e.target.value),
                                      },
                                    }))
                                  }
                                  disabled={viewMode}
                                  className="h-8"
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Desktop table layout */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Approved</TableHead>
                            <TableHead>Used</TableHead>
                            <TableHead>Returned</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {request.properties.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>{p.property_name}</TableCell>
                              <TableCell>{(p as any).approved_quantity ?? (p as any).quantity ?? "-"}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={resourceUsage[p.id]?.used ?? 0}
                                  onChange={(e) =>
                                    setResourceUsage((prev) => ({
                                      ...prev,
                                      [p.id]: {
                                        used: Number(e.target.value),
                                        returned: prev[p.id]?.returned ?? 0,
                                      },
                                    }))
                                  }
                                  disabled={viewMode}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={resourceUsage[p.id]?.returned ?? 0}
                                  onChange={(e) =>
                                    setResourceUsage((prev) => ({
                                      ...prev,
                                      [p.id]: {
                                        used: prev[p.id]?.used ?? 0,
                                        returned: Number(e.target.value),
                                      },
                                    }))
                                  }
                                  disabled={viewMode}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="evaluator">Evaluator</Label>
                  <Input
                    id="evaluator"
                    value={formData.evaluator}
                    onChange={(e) => setFormData((prev) => ({ ...prev, evaluator: e.target.value }))}
                    placeholder="Your name"
                    disabled={viewMode}
                  />
                </div>

                <div>
                  <Label htmlFor="date">Evaluation Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    disabled={viewMode}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Evaluation Criteria</h3>
                <div className="space-y-4">
                  {criteria.map((criterion) => (
                    <Card key={criterion.id} className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm sm:text-base">{criterion.name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{criterion.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs w-fit">{criterion.category}</Badge>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center gap-1 sm:gap-2 justify-center sm:justify-start">
                          {[1,2,3,4,5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => handleScoreChange(criterion.id, n)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded border text-xs sm:text-sm font-medium transition-colors ${
                                (scores[criterion.id] || 0) >= n 
                                  ? "bg-primary text-primary-foreground border-primary" 
                                  : "bg-background hover:bg-muted"
                              }`}
                              disabled={viewMode}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground text-center sm:text-left mt-2">
                          Score: {scores[criterion.id] || 0}/5
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Penalties (if applicable)</h3>
                <div className="space-y-3">
                  <Card className="p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={penalties.lateReturn}
                        onChange={(e) => setPenalties((prev) => ({ ...prev, lateReturn: e.target.checked }))}
                        className="rounded mt-1"
                        disabled={viewMode}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-sm sm:text-base">Late Return (-2 points)</span>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Returned more than 12 hours late</p>
                      </div>
                    </label>
                  </Card>

                  <Card className="p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={penalties.unreportedLoss}
                        onChange={(e) => setPenalties((prev) => ({ ...prev, unreportedLoss: e.target.checked }))}
                        className="rounded mt-1"
                        disabled={viewMode}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-sm sm:text-base">Unreported Loss/Damage (-3 points)</span>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Failed to report damage or missing items</p>
                      </div>
                    </label>
                  </Card>

                  <Card className="p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={penalties.wastedConsumables}
                        onChange={(e) => setPenalties((prev) => ({ ...prev, wastedConsumables: e.target.checked }))}
                        className="rounded mt-1"
                        disabled={viewMode}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-sm sm:text-base">Wasted Consumables (-3 points)</span>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Excessive waste of markers, paper, etc.</p>
                      </div>
                    </label>
                  </Card>
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
                  disabled={viewMode}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <div className="flex gap-3 order-2 sm:order-1">
                  {existingEvaluation && (
                    <Button type="button" variant="outline" onClick={() => setViewMode((v) => !v)} className="flex-1 sm:flex-none">
                      {viewMode ? "Edit" : "View"}
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                    Cancel
                  </Button>
                </div>
                <Button type="submit" disabled={isPending || viewMode} className="order-1 sm:order-2 flex-1 sm:flex-none">
                  {isPending ? (existingEvaluation ? "Updating..." : "Submitting...") : (existingEvaluation ? "Update" : "Submit Evaluation")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


