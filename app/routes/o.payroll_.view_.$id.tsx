
// import { Card } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { ArrowLeft, Building2, Calendar, Download, User } from 'lucide-react'
import { Link } from "@remix-run/react"
import { Button } from "~/components/ui/button"

// export default function Payslip() {
//   // Données fictives
//   const employeeData = {
//     name: "Soro Baïna",
//     id: "EMP123456",
//     position: "Auxiliaire de vente",
//     department: "Vente",
//   }

//   const companyData = {
//     name: "Pharmacie Val d'Oise",
//     address: "Centre commercial KOKOH Mall, Bessikoi",
//     city: "Cocody, Abidjan",
//     email: "pharmacievaldoise@gmail.com",
//     phone: "+225 07 00 00 37 37",
//     location: "400m du CHU d'Angré"
//   }

//   const payPeriod = {
//     month: "Janvier",
//     year: "2024",
//     workingDays: 22,
//     workedDays: 22,
//   }

//   const earnings = [
//     { description: "Salaire de base", amount: 150_000 },
//     { description: "Prime de performance", amount: 15_000 },
//     { description: "Prime de transport", amount: 25_000 },
//   ]

//   const deductions = [
//     { description: "Cotisation retraite", amount: 7_500 },
//     { description: "Assurance maladie", amount: 5_000 },
//     { description: "Cotisation chômage", amount: 3_000 },
//     { description: "Impôt sur le revenu", amount: 15_000 },
//   ]

//   // Calculs
//   const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0)
//   const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0)
//   const netSalary = totalEarnings - totalDeductions

//   return (
//     <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
//     <Button asChild variant="outline" className="mb-6 h-12 text-base">
//       <Link prefetch="intent" to="/o/payroll">
//         <ArrowLeft className="mr-2 h-5 w-5" />
//         Retour à la liste
//       </Link>
//     </Button>

//     <div className="flex justify-between items-center mb-6">
//       <h1 className="text-2xl font-bold">Fiche de paie</h1>
//       <Button className="flex items-center gap-2">
//         <Download className="h-5 w-5" />
//         Télécharger la fiche de paie
//       </Button>
//     </div>

//     <Card className="max-w-4xl mx-auto p-8 space-y-8">
//       {/* En-tête */}
//       <div className="grid grid-cols-2 gap-8 pb-6 border-b">
//         <div className="space-y-4">
//           <div className="flex items-center gap-2 text-lg font-semibold">
//             <Building2 className="h-5 w-5" />
//             <h2>Entreprise</h2>
//           </div>
//           <div className="space-y-1">
//             <p className="font-medium">{companyData.name}</p>
//             <p className="text-sm text-muted-foreground">{companyData.address}</p>
//             <p className="text-sm text-muted-foreground">{companyData.city}</p>
//             <p className="text-sm text-muted-foreground">Email: {companyData.email}</p>
//             <p className="text-sm text-muted-foreground">Tél: {companyData.phone}</p>
//             <p className="text-sm text-muted-foreground">{companyData.location}</p>
//           </div>
//         </div>

//         <div className="space-y-4">
//           <div className="flex items-center gap-2 text-lg font-semibold">
//             <User className="h-5 w-5" />
//             <h2>Salarié</h2>
//           </div>
//           <div className="space-y-1">
//             <p className="font-medium">{employeeData.name}</p>
//             <p className="text-sm text-muted-foreground">ID: {employeeData.id}</p>
//             <p className="text-sm text-muted-foreground">{employeeData.position}</p>
//             <p className="text-sm text-muted-foreground">{employeeData.department}</p>
//           </div>
//         </div>
//       </div>

//       {/* Période de paie */}
//       <div className="space-y-4">
//         <div className="flex items-center gap-2 text-lg font-semibold">
//           <Calendar className="h-5 w-5" />
//           <h2>Période de paie</h2>
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-1">
//             <p className="text-sm text-muted-foreground">Période</p>
//             <p className="font-medium">{payPeriod.month} {payPeriod.year}</p>
//           </div>
//           <div className="space-y-1">
//             <p className="text-sm text-muted-foreground">Jours travaillés</p>
//             <p className="font-medium">{payPeriod.workedDays} / {payPeriod.workingDays}</p>
//           </div>
//         </div>
//       </div>

//       {/* Tableau des revenus et déductions */}
//       <div className="space-y-6">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead className="w-[50%]">Description</TableHead>
//               <TableHead className="text-right">Montant (F CFA)</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {/* Revenus */}
//             <TableRow>
//               <TableCell colSpan={2} className="font-medium bg-muted">Revenus</TableCell>
//             </TableRow>
//             {earnings.map((item, index) => (
//               <TableRow key={`earning-${index}`}>
//                 <TableCell>{item.description}</TableCell>
//                 <TableCell className="text-right">{item.amount.toLocaleString('fr-FR')}</TableCell>
//               </TableRow>
//             ))}
//             <TableRow>
//               <TableCell className="font-medium">Total Revenus</TableCell>
//               <TableCell className="text-right font-medium">{totalEarnings.toLocaleString('fr-FR')}</TableCell>
//             </TableRow>

//             {/* Déductions */}
//             <TableRow>
//               <TableCell colSpan={2} className="font-medium bg-muted">Déductions</TableCell>
//             </TableRow>
//             {deductions.map((item, index) => (
//               <TableRow key={`deduction-${index}`}>
//                 <TableCell>{item.description}</TableCell>
//                 <TableCell className="text-right text-red-500">-{item.amount.toLocaleString('fr-FR')}</TableCell>
//               </TableRow>
//             ))}
//             <TableRow>
//               <TableCell className="font-medium">Total Déductions</TableCell>
//               <TableCell className="text-right font-medium text-red-500">-{totalDeductions.toLocaleString('fr-FR')}</TableCell>
//             </TableRow>
//           </TableBody>
//         </Table>

//         {/* Net à payer */}
//         <div className="border-t pt-4">
//           <div className="flex justify-between items-center text-lg font-semibold">
//             <span>Net à payer</span>
//             <span>{netSalary.toLocaleString('fr-FR')} F CFA</span>
//           </div>
//         </div>
//       </div>

//       {/* Pied de page */}
//       <div className="text-sm text-muted-foreground border-t pt-6">
//         <p>Document à conserver sans limitation de durée</p>
//         <p>Ce bulletin de paie est établi sur la base de 40 heures hebdomadaires conformément à la législation ivoirienne du travail</p>
//       </div>
//     </Card>
//     </div>
//   )
// }

import { MapPin } from "lucide-react"

export default function Payslip() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-8xl">
    <Button asChild variant="outline" className="mb-6 h-12 text-base">
      <Link prefetch="intent" to="/o/payroll">
        <ArrowLeft className="mr-2 h-5 w-5" />
        Retour à la liste
      </Link>
    </Button>

    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Fiche de paie</h1>
      <Button className="flex items-center gap-2">
        <Download className="h-5 w-5" />
        Télécharger la fiche de paie
      </Button>
    </div>

    <div className="min-h-screen bg-white p-4">
      <div className="mx-auto max-w-4xl border border-gray-300 shadow-md">
        {/* Header */}
        <div className="grid grid-cols-[250px,1fr] border-b border-gray-300">
          <div className="p-4 border-r border-gray-300">
            <div className="flex flex-col items-center">
              {/* <div className="w-20 h-20 mb-2">
                <MapPin className="w-full h-full text-green-500" />
              </div>
              <div className="text-green-600 text-center">
                <div className="text-xl">Pharmacie</div>
                <div className="text-xl">Val d&apos;Oise</div>
              </div> */}
               <img
              src="/img/logo-white-3.png"
              alt="logo"
              className="mx-auto mb-3 h-auto w-auto"
            />
            </div>
          </div>

          <div>
            <div className="bg-[#e8f5e9] p-2 border-b border-gray-300">
              <div className="font-bold">BULLETIN DE PAIE</div>
            </div>
            <div className="grid grid-cols-2 text-sm p-2 border-b border-gray-300">
              <div>
                <span>Période du : 01/08/24</span>
                <span className="ml-4">au : 31/08/24</span>
              </div>
              <div>
                <span>Paiement le : 31/08/24</span>
                <span className="ml-4">par : Virement</span>
              </div>
            </div>

            <div className="grid grid-cols-6 text-sm border-b border-gray-300">
              <div className="border-r border-gray-300 p-2">
                <div>Matricule</div>
                <div>M008</div>
              </div>
              <div className="border-r border-gray-300 p-2">
                <div>Niveau</div>
                <div></div>
              </div>
              <div className="border-r border-gray-300 p-2">
                <div>Coefficient</div>
                <div></div>
              </div>
              <div className="border-r border-gray-300 p-2">
                <div>Indice</div>
                <div>4</div>
              </div>
              <div className="border-r border-gray-300 p-2">
                <div>Ancienneté</div>
                <div>{`${0} an(s) et ${0} mois`}</div>
              </div>
              <div className="p-2">
                <div>N° de Sécurité Sociale</div>
                <div>294011986491</div>
              </div>
            </div>

            <div className="grid grid-cols-3 text-sm border-b border-gray-300">
              <div className="border-r border-gray-300 p-2">
                <div>Catégorie</div>
                <div>2</div>
              </div>
              <div className="border-r border-gray-300 p-2">
                <div>Emploi occupé</div>
                <div>VENDEUSE</div>
              </div>
              <div className="p-2">
                <div>Département</div>
                <div></div>
              </div>
            </div>

            <div className="grid grid-cols-3 text-sm border-t border-gray-300">
              <div className="border-r border-gray-300 p-2">
                <div>Qualification</div>
              </div>
              <div className="border-r border-gray-300 p-2">
                <div>Horaire</div>
                <div>173,33</div>
              </div>
              <div className="p-2">
                <div>CCN CONVENTION COLLECTIVE INTERPROFESSIONNELLE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Name */}
        <div className="bg-gray-200 p-2 text-right">
          {" "}
          {/* Updated class name */}
          <span className="font-semibold mr-4">Mlle</span>
          <span>YAO AMANI GISELE</span>
        </div>

        {/* Leave Balance */}
        <div className="grid grid-cols-2 border-b border-gray-300">
          {" "}
          {/* Updated class name */}
          <div className="p-2 text-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th></th>
                  <th className="text-right p-1">Acquis</th>
                  <th className="text-right p-1">Reste à prendre</th>
                  <th className="text-right p-1">Pris</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Repos comp.</td>
                  <td className="text-right p-1">0,00</td>
                  <td className="text-right p-1">0,00</td>
                  <td className="text-right p-1">0,00</td>
                </tr>
                <tr>
                  <td>Congés</td>
                  <td className="text-right p-1">6,00</td>
                  <td className="text-right p-1">90,00</td>
                  <td className="text-right p-1">0,00</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4">
              <div>Dates de congés :</div>
              <table className="w-full text-sm mt-1">
                <tbody>
                  <tr>
                    <td></td>
                    <td className="text-right p-1">du</td>
                    <td className="text-right p-1">du</td>
                    <td className="text-right p-1">du</td>
                  </tr>
                  <tr>
                    <td></td>
                    <td className="text-right p-1">au</td>
                    <td className="text-right p-1">au</td>
                    <td className="text-right p-1">au</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2">
              <div>Commentaire :</div>
            </div>
          </div>
          <div className="bg-[#e8f5e9] p-2"></div>
        </div>

        {/* Salary Details */}
        <div className="text-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left p-2">N°</th>
                <th className="text-left p-2">Désignation</th>
                <th className="text-right p-2">Nombre</th>
                <th className="text-right p-2">Base</th>
                <th className="text-center p-2 border-l border-gray-300" colSpan={3}>
                  Part salariale
                </th>
                <th className="text-center p-2 border-l border-gray-300" colSpan={3}>
                  Part patronale
                </th>
              </tr>
              <tr className="border-b border-gray-300">
                <th className="text-left p-2"></th>
                <th className="text-left p-2"></th>
                <th className="text-right p-2"></th>
                <th className="text-right p-2"></th>
                <th className="text-right p-2 border-l border-gray-300">Taux</th>
                <th className="text-right p-2">Gain</th>
                <th className="text-right p-2">Retenue</th>
                <th className="text-right p-2 border-l border-gray-300">Taux</th>
                <th className="text-right p-2">Retenue (+)</th>
                <th className="text-right p-2">Retenue (-)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { no: "1", designation: "Nombre de parts", nombre: "1,00", base: "0,00", gain: "0" },
                {
                  no: "11",
                  designation: "Salaire de base",
                  nombre: "30,00",
                  base: "92084,00",
                  taux: "3000,00",
                  gain: "92084",
                },
                {
                  no: "21",
                  designation: "Sursalaire",
                  nombre: "30,00",
                  base: "271075,00",
                  taux: "3000,00",
                  gain: "271075",
                },
                { no: "100", designation: "Prime d'Ancienneté", base: "92084,00", taux: "3,00", gain: "2763" },
                {
                  no: "116",
                  designation: "Prime de responsabilité",
                  nombre: "30,00",
                  base: "35000,00",
                  taux: "3000,00",
                  gain: "35000",
                },
                { no: "126", designation: "Prime de garde", gain: "34388" },
                { no: "", designation: "Total Brut", gain: "435310" },
                {
                  no: "103",
                  designation: "RETENUE ITS UNIQUE / SALAIRE",
                  base: "435310,00",
                  taux: "6,30",
                  retenue: "67415",
                },
                {
                  no: "830",
                  designation: "Retraite",
                  base: "500,00",
                  taux: "100,00",
                  retenue: "27425",
                  tauxPatronal: "7,70",
                  retenuePatronalePlus: "33519",
                },
                {
                  no: "870",
                  designation: "CMU",
                  base: "500,00",
                  taux: "100,00",
                  retenue: "500",
                  tauxPatronal: "0,00",
                  retenuePatronalePlus: "0",
                },
                { no: "", designation: "Total Cotisations", retenue: "95340", retenuePatronaleMinus: "33519" },
                { no: "950", designation: "Arrondi de paie", gain: "30" },
                {
                  no: "958",
                  designation: "Prime de Transport Non Imposa",
                  nombre: "30,00",
                  base: "30000,00",
                  taux: "3000,00",
                  gain: "30000",
                },
                { no: "960", designation: "Prime de Rendement", gain: "130000" },
              ].map((row, index) => (
                <tr key={index} className="border-t border-gray-300">
                  <td className="p-2">{row.no}</td>
                  <td className="p-2">{row.designation}</td>
                  <td className="text-right p-2">{row.nombre}</td>
                  <td className="text-right p-2">{row.base}</td>
                  <td className="text-right p-2 border-l border-gray-300">{row.taux}</td>
                  <td className="text-right p-2">{row.gain}</td>
                  <td className="text-right p-2">{row.retenue}</td>
                  <td className="text-right p-2 border-l border-gray-300">{row.tauxPatronal}</td>
                  <td className="text-right p-2">{row.retenuePatronalePlus}</td>
                  <td className="text-right p-2">{row.retenuePatronaleMinus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 border-t border-gray-300">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="p-2">Cumuls</td>
                <td className="p-2">Salaire brut</td>
                <td className="p-2">Net imposable</td>
                <td className="p-2">Charges salariales</td>
                <td className="p-2">Charges patronales</td>
                <td className="p-2">Heures travaillées</td>
                <td className="p-2">Heures sup.</td>
                <td className="p-2">Avantages en nature</td>
                <td className="p-2 bg-[#e8f5e9] font-bold">NET A PAYER</td>
              </tr>
              <tr className="border-t border-gray-300">
                <td className="p-2">Période</td>
                <td className="p-2">435310</td>
                <td className="p-2">367895</td>
                <td className="p-2">95340</td>
                <td className="p-2">33519</td>
                <td className="p-2">173</td>
                <td className="p-2">0</td>
                <td className="p-2">0</td>
                <td className="p-2 font-bold">500000</td>
              </tr>
              <tr className="border-t border-gray-300">
                <td className="p-2">Année</td>
                <td className="p-2">1270407</td>
                <td className="p-2">1075621</td>
                <td className="p-2">276322</td>
                <td className="p-2">97821</td>
                <td className="p-2">520</td>
                <td className="p-2">0</td>
                <td className="p-2">0</td>
                <td className="p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-xs p-4 text-center border-t border-gray-300">
          <div className="flex justify-between items-center text-[clamp(0.5rem,1.5vw,0.75rem)]">
            <p>Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.</p>
            <p>Val d&apos;Oise</p>
          </div>
          <div className="h-2 bg-[#2E7D32] mt-4"></div>
        </div>
      </div>
    </div>
    </div>
  )
}

