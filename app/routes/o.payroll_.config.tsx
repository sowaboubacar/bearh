"use client"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Separator } from "~/components/ui/separator"
import { Switch } from "~/components/ui/switch"
import { useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import type { PayslipConfig, DeductionItem, EarningItem } from "~/types/payslip"
import { Link } from "@remix-run/react"

export default function PayslipConfigPage() {
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<PayslipConfig>({
    company: {
      name: "Pharmacie Val d'Oise",
      address: "Centre commercial KOKOH Mall, Bessikoi",
      city: "Cocody, Abidjan",
      email: "pharmacievaldoise@gmail.com",
      phone: "+225 07 00 00 37 37",
      location: "400m du CHU d'Angré"
    },
    defaultCurrency: "F CFA",
    legislation: "Ivoirienne",
    workingHours: 40,
    globalDeductions: [
      { id: "1", description: "Cotisation retraite", amount: 5, isPercentage: true },
      { id: "2", description: "Assurance maladie", amount: 3, isPercentage: true },
      { id: "3", description: "Cotisation chômage", amount: 2, isPercentage: true },
    ],
    globalEarnings: [
      { id: "1", description: "Prime de transport", amount: 25000, isPercentage: false },
      { id: "2", description: "Prime de présence", amount: 15000, isPercentage: false },
    ]
  })

  const handleSave = async () => {
    try {
      setLoading(true)
      // Simuler une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Configuration sauvegardée avec succès")
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyChange = (field: keyof typeof config.company, value: string) => {
    setConfig(prev => ({
      ...prev,
      company: {
        ...prev.company,
        [field]: value
      }
    }))
  }

  const handleGlobalSettingChange = (field: keyof PayslipConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addGlobalDeduction = () => {
    setConfig(prev => ({
      ...prev,
      globalDeductions: [
        ...prev.globalDeductions,
        {
          id: Date.now().toString(),
          description: "",
          amount: 0,
          isPercentage: false
        }
      ]
    }))
  }

  const removeGlobalDeduction = (id: string) => {
    setConfig(prev => ({
      ...prev,
      globalDeductions: prev.globalDeductions.filter(item => item.id !== id)
    }))
  }

  const updateGlobalDeduction = (id: string, field: keyof DeductionItem, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      globalDeductions: prev.globalDeductions.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }))
  }

  const addGlobalEarning = () => {
    setConfig(prev => ({
      ...prev,
      globalEarnings: [
        ...prev.globalEarnings,
        {
          id: Date.now().toString(),
          description: "",
          amount: 0,
          isPercentage: false
        }
      ]
    }))
  }

  const removeGlobalEarning = (id: string) => {
    setConfig(prev => ({
      ...prev,
      globalEarnings: prev.globalEarnings.filter(item => item.id !== id)
    }))
  }

  const updateGlobalEarning = (id: string, field: keyof EarningItem, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      globalEarnings: prev.globalEarnings.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }))
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
    <Button asChild variant="outline" className="mb-6 h-12 text-base">
      <Link prefetch="intent" to="/o/payroll">
        <ArrowLeft className="mr-2 h-5 w-5" />
        Retour à la liste
      </Link>
    </Button>
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Configuration des Fiches de Paie</h1>
          <p className="text-muted-foreground">
            Gérez les paramètres globaux des fiches de paie
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les modifications
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">Entreprise</TabsTrigger>
          <TabsTrigger value="earnings">Revenus Globaux</TabsTrigger>
          <TabsTrigger value="deductions">Déductions Globales</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l&apos;entreprise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de l&apos;entreprise</Label>
                <Input 
                  value={config.company.name} 
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input 
                  value={config.company.address} 
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input 
                  value={config.company.city} 
                  onChange={(e) => handleCompanyChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={config.company.email} 
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input 
                  value={config.company.phone} 
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Localisation</Label>
                <Input 
                  value={config.company.location} 
                  onChange={(e) => handleCompanyChange('location', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Revenus Globaux</CardTitle>
              <Button onClick={addGlobalEarning} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {config.globalEarnings.map((earning) => (
                <div key={earning.id} className="space-y-4">
                  <Separator />
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input 
                        value={earning.description}
                        onChange={(e) => updateGlobalEarning(earning.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Montant</Label>
                      <Input 
                        type="number"
                        value={earning.amount}
                        onChange={(e) => updateGlobalEarning(earning.id, 'amount', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={earning.isPercentage}
                        onCheckedChange={(checked) => updateGlobalEarning(earning.id, 'isPercentage', checked)}
                      />
                      <Label>Calculer en pourcentage</Label>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeGlobalEarning(earning.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {config.globalEarnings.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Aucun revenu global configuré
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Déductions Globales</CardTitle>
              <Button onClick={addGlobalDeduction} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {config.globalDeductions.map((deduction) => (
                <div key={deduction.id} className="space-y-4">
                  <Separator />
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input 
                        value={deduction.description}
                        onChange={(e) => updateGlobalDeduction(deduction.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Montant</Label>
                      <Input 
                        type="number"
                        value={deduction.amount}
                        onChange={(e) => updateGlobalDeduction(deduction.id, 'amount', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={deduction.isPercentage}
                        onCheckedChange={(checked) => updateGlobalDeduction(deduction.id, 'isPercentage', checked)}
                      />
                      <Label>Calculer en pourcentage</Label>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeGlobalDeduction(deduction.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {config.globalDeductions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune déduction globale configurée
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Devise par défaut</Label>
                <Input 
                  value={config.defaultCurrency} 
                  onChange={(e) => handleGlobalSettingChange('defaultCurrency', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Législation</Label>
                <Input 
                  value={config.legislation} 
                  onChange={(e) => handleGlobalSettingChange('legislation', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Heures de travail hebdomadaires</Label>
                <Input 
                  type="number" 
                  value={config.workingHours} 
                  onChange={(e) => handleGlobalSettingChange('workingHours', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  )
}

