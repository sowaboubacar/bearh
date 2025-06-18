"use client"

import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import { Checkbox } from "~/components/ui/checkbox"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Separator } from "~/components/ui/separator"
import { CalendarIcon, Download, Eye, FileText, Pencil, Plus, Search, User } from 'lucide-react'
import { useState } from "react"
import { Link } from "@remix-run/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"

// Cette données seront récupérées depuis une base de données
const employees = [
  { id: "1", name: "Soro Baïna" },
  { id: "2", name: "Koné Amadou" },
  { id: "3", name: "Touré Mariam" },
  { id: "4", name: "Diabaté Fatoumata" },
  { id: "5", name: "Ouattara Ibrahim" },
]

const payroll = [
  {
    id: "1",
    employeeName: "Soro Baïna",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    period: "Janvier 2024",
    netSalary: 164500,
    status: "Généré",
    generatedAt: "2024-01-15",
  },
  {
    id: "2",
    employeeName: "Koné Amadou",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    period: "Janvier 2024",
    netSalary: 225000,
    status: "En attente",
    generatedAt: "2024-01-15",
  },
  {
    id: "3",
    employeeName: "Touré Mariam",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    period: "Janvier 2024",
    netSalary: 185000,
    status: "Généré",
    generatedAt: "2024-01-15",
  },
]

export default function PayslipsPage() {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [open, setOpen] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: new Date(2024, i).toLocaleString('fr-FR', { month: 'long' })
  }))

  const filteredPayroll = payroll.filter(payslip => {
    const matchesSearch = searchTerm ? 
      payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) : 
      true
    const matchesStatus = selectedStatus !== "all" ? 
      payslip.status === selectedStatus : 
      true
    return matchesSearch && matchesStatus
  })

  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => {
      if (!prev) return [employeeId]
      return prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    })
  }

  const handleSelectAll = () => {
    setSelectedEmployees(prev => 
      prev.length === employees.length ? [] : employees.map(emp => emp.id)
    )
  }

  const getGenerateButtonText = () => {
    if (!selectedEmployees.length) return "Générer pour tous"
    const count = selectedEmployees.length
    return `Générer (${count} sélectionné${count > 1 ? 's' : ''})`
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Fiches de Paie</h1>
          <p className="text-muted-foreground">
            Gérez et visualisez les fiches de paie des employés
          </p>
        </div>
      </div>

      {/* Stats Cards - More compact layout */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Fiches</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{payroll.length}</div>
            <p className="text-xs text-muted-foreground">Pour le mois en cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Employés</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">Actifs ce mois</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Période Actuelle</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">Janvier 2024</div>
            <p className="text-xs text-muted-foreground">Du 01/01 au 31/01</p>
          </CardContent>
        </Card>
      </div>

      {/* Generation and Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Génération des Fiches</CardTitle>
              <CardDescription>
                Sélectionnez les employés et la période
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('Génération pour:', selectedEmployees)
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {getGenerateButtonText()}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Selection */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[300px] justify-start">
                  {selectedEmployees.length > 0
                    ? `${selectedEmployees.length} employé${selectedEmployees.length > 1 ? 's' : ''} sélectionné${selectedEmployees.length > 1 ? 's' : ''}`
                    : "Sélectionner des employés"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Sélection des employés</DialogTitle>
                  <DialogDescription>
                    Sélectionnez les employés pour lesquels générer les fiches de paie
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={selectedEmployees.length === employees.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <label className="text-sm font-medium leading-none">
                        Tous les employés
                      </label>
                    </div>
                    <Separator />
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox 
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={() => handleEmployeeSelection(employee.id)}
                        />
                        <label className="text-sm font-medium leading-none">
                          {employee.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* Period Selection */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payslips List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Fiches de Paie</CardTitle>
              <CardDescription>
                Liste de toutes les fiches de paie générées
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Généré">Généré</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Net à Payer</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date Génération</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayroll.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={payslip.employeeAvatar || "/placeholder.svg"}
                        alt={payslip.employeeName}
                        className="h-8 w-8 rounded-full"
                      />
                      <span>{payslip.employeeName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{payslip.period}</TableCell>
                  <TableCell>{payslip.netSalary.toLocaleString('fr-FR')} F CFA</TableCell>
                  <TableCell>
                    <Badge variant={payslip.status === "Généré" ? "default" : "secondary"}>
                      {payslip.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(payslip.generatedAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link prefetch="intent" to={`/o/payroll/view/${payslip.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link prefetch="intent" to={`/o/payroll/edit/${payslip.id}`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

