"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateLeadCpf } from "@/lib/leads"
import { Check, X, Edit3, CreditCard } from "lucide-react"

interface EditableCpfFieldProps {
  leadId: number
  currentCpf: string
  onCpfUpdate: (newCpf: string) => void
  className?: string
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "")
  return digits.length === 11
}

export function EditableCpfField({ leadId, currentCpf, onCpfUpdate, className = "" }: EditableCpfFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(formatCpf(currentCpf || ""))
  const [loading, setLoading] = useState(false)

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(formatCpf(currentCpf || ""))
  }

  const handleSave = async () => {
    if (editValue && !isValidCpf(editValue)) return

    setLoading(true)

    try {
      const formattedCpf = formatCpf(editValue)
      const success = await updateLeadCpf(leadId, formattedCpf)

      if (success) {
        onCpfUpdate(formattedCpf)
        setIsEditing(false)
      } else {
        setEditValue(formatCpf(currentCpf || ""))
      }
    } catch (error) {
      console.error("Error updating cpf:", error)
      setEditValue(formatCpf(currentCpf || ""))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(formatCpf(currentCpf || ""))
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
          <CreditCard className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            value={editValue}
            onChange={(e) => setEditValue(formatCpf(e.target.value))}
            onKeyDown={handleKeyPress}
            className={`text-xs h-7 pl-6 pr-1 ${
              editValue && !isValidCpf(editValue)
                ? "border-red-300 focus:border-red-500"
                : "border-green-300 focus:border-green-500"
            }`}
            placeholder="000.000.000-00"
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || !!(editValue && !isValidCpf(editValue))}
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
        <CreditCard className="h-4 w-4 text-green-600" />
        <div>
          <span className="text-sm font-medium text-green-800">CPF</span>
          <div className="text-sm text-gray-700">
            {currentCpf || <span className="text-gray-400 italic">Clique para adicionar CPF</span>}
          </div>
        </div>
      </div>
      <Edit3 className="h-4 w-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
