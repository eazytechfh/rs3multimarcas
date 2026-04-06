"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateLeadDataNascimento } from "@/lib/leads"
import { Check, X, Edit3, Calendar } from "lucide-react"

interface EditableDataNascimentoFieldProps {
  leadId: number
  currentDataNascimento: string
  onDataNascimentoUpdate: (newDataNascimento: string) => void
  className?: string
}

function toInputDate(value: string): string {
  if (!value) return ""
  if (value.includes("T")) return value.split("T")[0]
  return value
}

function formatDatePtBr(value: string): string {
  if (!value) return ""

  const date = new Date(`${toInputDate(value)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString("pt-BR")
}

export function EditableDataNascimentoField({
  leadId,
  currentDataNascimento,
  onDataNascimentoUpdate,
  className = "",
}: EditableDataNascimentoFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(toInputDate(currentDataNascimento || ""))
  const [loading, setLoading] = useState(false)

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(toInputDate(currentDataNascimento || ""))
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const normalizedDate = toInputDate(editValue)
      const success = await updateLeadDataNascimento(leadId, normalizedDate)

      if (success) {
        onDataNascimentoUpdate(normalizedDate)
        setIsEditing(false)
      } else {
        setEditValue(toInputDate(currentDataNascimento || ""))
      }
    } catch (error) {
      console.error("Error updating data_nascimento:", error)
      setEditValue(toInputDate(currentDataNascimento || ""))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(toInputDate(currentDataNascimento || ""))
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="relative flex-1">
          <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="text-xs h-7 pl-6 pr-1 border-green-300 focus:border-green-500"
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="h-7 w-7 p-0 border-gray-300 hover:bg-gray-50 bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-between group cursor-pointer hover:bg-green-50 rounded p-2 transition-colors border border-green-200 ${className}`}
      onClick={handleStartEdit}
    >
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-green-600" />
        <div>
          <span className="text-sm font-medium text-green-800">Data de Nascimento</span>
          <div className="text-sm text-gray-700">
            {currentDataNascimento ? (
              formatDatePtBr(currentDataNascimento)
            ) : (
              <span className="text-gray-400 italic">Clique para adicionar data de nascimento</span>
            )}
          </div>
        </div>
      </div>
      <Edit3 className="h-4 w-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
