"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"

interface DeleteSurveyRecordButtonProps {
  surveyRecordId: string
}

export function DeleteSurveyRecordButton({ surveyRecordId }: DeleteSurveyRecordButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this survey record? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("inspections").delete().eq("id", surveyRecordId)
      if (error) throw error
      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting survey record:", error)
      alert("Failed to delete survey record")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </Button>
  )
}
