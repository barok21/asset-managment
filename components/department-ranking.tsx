"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Award } from "lucide-react"

interface Department {
  id: number
  name: string
  averageScore: number
  usageCount: number
  finalScore: number
  rank: number
  trend: "up" | "down" | "stable"
  lastEvaluation: string
}

interface DepartmentRankingsProps {
  departments: Department[]
}

export default function DepartmentRankings({ departments }: DepartmentRankingsProps) {
  const sortedDepartments = [...departments].sort((a, b) => b.finalScore - a.finalScore)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getTierBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-yellow-500 text-white">Gold</Badge>
    if (score >= 80) return <Badge variant="secondary">Silver</Badge>
    if (score >= 70) return <Badge className="bg-orange-500 text-white">Bronze</Badge>
    return <Badge variant="destructive">Needs Improvement</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Department Rankings</CardTitle>
          <CardDescription>Rankings based on composite score: Quality (70%) + Usage Frequency (30%)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedDepartments.map((dept, index) => (
              <div
                key={dept.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getRankIcon(index + 1)}
                  <div>
                    <h3 className="font-semibold text-lg">{dept.name}</h3>
                    <p className="text-sm text-gray-600">Last evaluated: {dept.lastEvaluation}</p>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Final Score</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{dept.finalScore.toFixed(1)}</span>
                      {getTrendIcon(dept.trend)}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Quality Score</p>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{dept.averageScore.toFixed(1)}%</span>
                      <Progress value={dept.averageScore} className="w-16 h-2" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Usage Count</p>
                    <span className="font-semibold">{dept.usageCount} times</span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Tier</p>
                    {getTierBadge(dept.averageScore)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring System</CardTitle>
          <CardDescription>How the composite scores are calculated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Final Score Formula</h4>
              <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                Final Score = (Quality % × 0.7) + (Usage Score × 0.3)
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Quality is weighted at 70% to prioritize responsible stewardship over frequency of use.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Usage Frequency Scoring</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>1-2 uses:</span>
                  <span className="font-medium">5-10 points</span>
                </div>
                <div className="flex justify-between">
                  <span>3-5 uses:</span>
                  <span className="font-medium">15-25 points</span>
                </div>
                <div className="flex justify-between">
                  <span>6-10 uses:</span>
                  <span className="font-medium">30-50 points</span>
                </div>
                <div className="flex justify-between">
                  <span>20+ uses:</span>
                  <span className="font-medium">99 points (max)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
