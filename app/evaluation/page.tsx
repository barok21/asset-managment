import { listRecentEvaluations } from "@/lib/actions/property.action"
import DepartmentRankings from "@/components/department-ranking"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, User, Building2, Star, FileText, Clock } from "lucide-react"

export default async function Page() {
  const evaluations = await listRecentEvaluations(20)

  // Build department rankings data
  const deptToScores: Record<string, number[]> = {}
  const deptToCount: Record<string, number> = {}
  const deptToLast: Record<string, string> = {}

  for (const ev of evaluations) {
    const dept = (ev as any).department as string
    if (!dept) continue
    const total = (ev as any).totalScore as number
    if (!deptToScores[dept]) deptToScores[dept] = []
    if (!deptToCount[dept]) deptToCount[dept] = 0
    if (typeof total === "number") deptToScores[dept].push(total)
    deptToCount[dept] += 1
    const ts = new Date(ev.created_at).toISOString()
    if (!deptToLast[dept] || ts > deptToLast[dept]) deptToLast[dept] = ts
  }

  const maxCount = Math.max(1, ...Object.values(deptToCount))

  const departments = Object.keys(deptToScores).map((name, idx) => {
    const scores = deptToScores[name]
    const averageScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const usageCount = deptToCount[name] || 0
    const usageNorm = (usageCount / maxCount) * 100
    const finalScore = 0.7 * averageScore + 0.3 * usageNorm
    return {
      id: idx + 1,
      name,
      averageScore,
      usageCount,
      finalScore,
      rank: 0,
      trend: "stable" as const,
      lastEvaluation: deptToLast[name] ? new Date(deptToLast[name]).toLocaleDateString() : "-",
    }
  })

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Fair</Badge>
    return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Improvement</Badge>
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      
      <SidebarInset>
        <SiteHeader />
        
        <main className="flex flex-1 flex-col @container/main px-4 md:px-6 lg:px-8 py-4 md:py-6 gap-6">
          {/* Header Section */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Property Evaluations</h1>
            <p className="text-muted-foreground">
              Monitor and analyze property usage evaluations across departments
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{evaluations.length}</div>
                <p className="text-xs text-muted-foreground">
                  {evaluations.length > 0 ? "Active evaluations" : "No evaluations yet"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(deptToScores).length}</div>
                <p className="text-xs text-muted-foreground">
                  Participating departments
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {evaluations.length > 0 
                    ? (evaluations.reduce((sum, ev) => sum + (ev.totalScore || 0), 0) / evaluations.length).toFixed(1)
                    : "0"
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall performance
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Evaluation</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {evaluations.length > 0 
                    ? new Date(evaluations[0].created_at).toLocaleDateString()
                    : "N/A"
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Most recent activity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="flex flex-col space-y-4">
            {/* Department Rankings */}
            <div>
              <DepartmentRankings departments={departments} />
            </div>
            
            {/* Recent Evaluations */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Evaluations
                  </CardTitle>
                  <CardDescription>
                    Latest property usage evaluations and their scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {evaluations.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No evaluations yet</h3>
                      <p className="text-muted-foreground">
                        Property evaluations will appear here once they are submitted.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {evaluations.map((ev) => (
                        <Card key={ev.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                              <div className="space-y-1 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {ev.request_batch_id}
                                  </Badge>
                                  {getScoreBadge(ev.totalScore || 0)}
                                </div>
                                <h3 className="font-semibold text-base sm:text-lg">
                                  {ev.department} Department
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Evaluated by {ev.evaluator}
                                </p>
                              </div>
                              <div className="text-center sm:text-right">
                                <div className={`text-2xl sm:text-3xl font-bold ${getScoreColor(ev.totalScore || 0)}`}>
                                  {ev.totalScore}%
                                </div>
                                <Progress 
                                  value={ev.totalScore || 0} 
                                  className="w-16 sm:w-20 h-2 mt-1 mx-auto sm:mx-0"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium">{ev.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Evaluator:</span>
                                <span className="font-medium">{ev.evaluator}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Department:</span>
                                <span className="font-medium">{ev.department}</span>
                              </div>
                            </div>
                            
                            {ev.resources && Array.isArray(ev.resources) && ev.resources.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-2">Resources Evaluated:</p>
                                <div className="flex flex-wrap gap-2">
                                  {ev.resources.map((r: any, index: number) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {r.property_name}
                                      {r.used_quantity !== undefined && r.returned_quantity !== undefined && (
                                        <span className="ml-1 text-xs opacity-75">
                                          ({r.used_quantity}/{r.returned_quantity})
                                        </span>
                                      )}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Detailed Scores */}
                            {ev.scores && typeof ev.scores === 'object' && Object.keys(ev.scores).length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-2">Detailed Scores:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {Object.entries(ev.scores).map(([criterion, score]) => (
                                    <div key={criterion} className="flex justify-between items-center text-xs">
                                      <span className="capitalize">{criterion.replace(/_/g, ' ')}:</span>
                                      <div className="flex items-center gap-1">
                                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${(score as number / 5) * 100}%` }}
                                          />
                                        </div>
                                        <span className="font-medium w-6 text-right">{score}/5</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Penalties */}
                            {ev.penalties && typeof ev.penalties === 'object' && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-2">Penalties Applied:</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(ev.penalties).map(([penalty, applied]) => {
                                    if (applied) {
                                      return (
                                        <Badge key={penalty} variant="destructive" className="text-xs">
                                          {penalty === 'lateReturn' && 'Late Return (-2pts)'}
                                          {penalty === 'unreportedLoss' && 'Unreported Loss (-3pts)'}
                                          {penalty === 'wastedConsumables' && 'Wasted Consumables (-3pts)'}
                                        </Badge>
                                      )
                                    }
                                    return null
                                  })}
                                  {!Object.values(ev.penalties).some(Boolean) && (
                                    <Badge variant="secondary" className="text-xs">
                                      No penalties applied
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {ev.notes && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-1">Add Notes:</p>
                                <p className="text-sm bg-muted/50 p-3 rounded-md">{ev.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}