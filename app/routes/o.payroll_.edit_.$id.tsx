"use client"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Separator } from "~/components/ui/separator"
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useState, useEffect } from "react"
import { toast, Toaster } from "sonner"
import { json, Link, useLoaderData, useNavigation } from "@remix-run/react"
interface PayslipData {
  id: string
  employeeData: {
    name: string
    id: string
    position: string
    department: string
  }
  payPeriod: {
    month: string
    year: string
    workingDays: number
    workedDays: number
  }
  earnings: Array<{
    id: string
    description: string
    amount: number
  }>
  deductions: Array<{
    id: string
    description: string
    amount: number
  }>
}

// Dans une vraie application, cette fonction récupérerait les données depuis une API
async function getPayslipData(id: string): Promise<PayslipData> {
  return {
    id,
    employeeData: {
      name: "Soro Baïna",
      id: "EMP123456",
      position: "Auxiliaire de vente",
      department: "Vente",
    },
    payPeriod: {
      month: "Janvier",
      year: "2024",
      workingDays: 22,
      workedDays: 22,
    },
    earnings: [
      { id: "1", description: "Salaire de base", amount: 150000 },
      { id: "2", description: "Prime de performance", amount: 15000 },
      { id: "3", description: "Prime de transport", amount: 25000 },
    ],
    deductions: [
      { id: "1", description: "Cotisation retraite", amount: 7500 },
      { id: "2", description: "Assurance maladie", amount: 5000 },
      { id: "3", description: "Cotisation chômage", amount: 3000 },
      { id: "4", description: "Impôt sur le revenu", amount: 15000 },
    ],
  }
}

export const loader = async ({ params }: { params: { id: string } }) => {
  const payslipData = await getPayslipData(params.id)
  return json({ payslipData })
}

export default function EditPayslipPage() {
  const { payslipData: data } = useLoaderData<typeof loader>()  
  const [loading, setLoading] = useState(false)
  const [payslipData, setPayslipData] = useState<PayslipData | null>(data)
  const navigation = useNavigation()
const isLoading = navigation.state === "loading"

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!payslipData) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-muted-foreground">Impossible de charger la fiche de paie</p>
          <Link to="/o/payroll">
            <Button variant="link" className="mt-4">
              Retour à la liste
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const addEarning = () => {
    setPayslipData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        earnings: [
          ...prev.earnings,
          {
            id: Date.now().toString(),
            description: "",
            amount: 0
          }
        ]
      }
    })
  }

  const removeEarning = (id: string) => {
    setPayslipData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        earnings: prev.earnings.filter(item => item.id !== id)
      }
    })
  }

  const updateEarning = (id: string, field: 'description' | 'amount', value: string | number) => {
    setPayslipData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        earnings: prev.earnings.map(item =>
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    })
  }

  const addDeduction = () => {
    setPayslipData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        deductions: [
          ...prev.deductions,
          {
            id: Date.now().toString(),
            description: "",
            amount: 0
          }
        ]
      }
    })
  }

  const removeDeduction = (id: string) => {
    setPayslipData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        deductions: prev.deductions.filter(item => item.id !== id)
      }
    })
  }

  const updateDeduction = (id: string, field: 'description' | 'amount', value: string | number) => {
    setPayslipData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        deductions: prev.deductions.map(item =>
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    })
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      // Simuler une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Vérifier s'il y a des champs vides
      const hasEmptyEarnings = payslipData.earnings.some(e => !e.description || e.amount <= 0)
      const hasEmptyDeductions = payslipData.deductions.some(d => !d.description || d.amount <= 0)
      
      if (hasEmptyEarnings || hasEmptyDeductions) {
        toast.warning("Attention: Certains champs sont vides ou invalides")
        return
      }

      // Simuler la sauvegarde réussie
      toast.success("Fiche de paie mise à jour avec succès", {
        description: `Net à payer: ${netSalary.toLocaleString('fr-FR')} F CFA`
      })
    } catch (error) {
      toast.error("Erreur lors de la mise à jour", {
        description: "Veuillez réessayer plus tard"
      })
    } finally {
      setLoading(false)
    }
  }

  const totalEarnings = payslipData.earnings.reduce((sum, item) => sum + item.amount, 0)
  const totalDeductions = payslipData.deductions.reduce((sum, item) => sum + item.amount, 0)
  const netSalary = totalEarnings - totalDeductions

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
    <Button asChild variant="outline" className="mb-6 h-12 text-base">
      <Link prefetch="intent" to="/o/payroll">
        <ArrowLeft className="mr-2 h-5 w-5" />
        Retour à la liste
      </Link>
    </Button>
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/o/payroll">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Modifier la Fiche de Paie</h1>
            <p className="text-muted-foreground">
              {payslipData.employeeData.name} - {payslipData.payPeriod.month} {payslipData.payPeriod.year}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer les modifications
        </Button>
      </div>

      <div className="grid gap-8">
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de Base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employé</Label>
                <Input value={payslipData.employeeData.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>ID Employé</Label>
                <Input value={payslipData.employeeData.id} disabled />
              </div>
              <div className="space-y-2">
                <Label>Poste</Label>
                <Input value={payslipData.employeeData.position} disabled />
              </div>
              <div className="space-y-2">
                <Label>Département</Label>
                <Input value={payslipData.employeeData.department} disabled />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Période</Label>
                <Input 
                  value={`${payslipData.payPeriod.month} ${payslipData.payPeriod.year}`} 
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label>Jours travaillés</Label>
                <Input 
                  type="number"
                  value={payslipData.payPeriod.workedDays}
                  onChange={(e) => {
                    setPayslipData(prev => {
                      if (!prev) return prev
                      return {
                        ...prev,
                        payPeriod: {
                          ...prev.payPeriod,
                          workedDays: parseInt(e.target.value)
                        }
                      }
                    })
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenus */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenus</CardTitle>
            <Button onClick={addEarning} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un revenu
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {payslipData.earnings.map((earning) => (
              <div key={earning.id} className="space-y-4">
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input 
                      value={earning.description}
                      onChange={(e) => updateEarning(earning.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Montant (F CFA)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        value={earning.amount}
                        onChange={(e) => updateEarning(earning.id, 'amount', parseFloat(e.target.value))}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeEarning(earning.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Déductions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Déductions</CardTitle>
            <Button onClick={addDeduction} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une déduction
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {payslipData.deductions.map((deduction) => (
              <div key={deduction.id} className="space-y-4">
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input 
                      value={deduction.description}
                      onChange={(e) => updateDeduction(deduction.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Montant (F CFA)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        value={deduction.amount}
                        onChange={(e) => updateDeduction(deduction.id, 'amount', parseFloat(e.target.value))}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeDeduction(deduction.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Résumé */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Revenus</Label>
                <Input 
                  value={totalEarnings.toLocaleString('fr-FR')} 
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label>Total Déductions</Label>
                <Input 
                  value={totalDeductions.toLocaleString('fr-FR')} 
                  disabled 
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Net à Payer</Label>
              <div className="text-2xl font-bold">
                {netSalary.toLocaleString('fr-FR')} F CFA
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster position="top-right" richColors />
    </div>
    </div>
  )
}

