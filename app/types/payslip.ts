export interface Employee {
    id: string
    name: string
    position: string
    department: string
  }
  
  export interface CompanyConfig {
    name: string
    address: string
    city: string
    email: string
    phone: string
    location: string
  }
  
  export interface PayslipConfig {
    company: CompanyConfig
    defaultCurrency: string
    legislation: string
    workingHours: number
    globalDeductions: DeductionItem[]
    globalEarnings: EarningItem[]
  }
  
  export interface DeductionItem {
    id: string
    description: string
    amount: number
    isPercentage: boolean
  }
  
  export interface EarningItem {
    id: string
    description: string
    amount: number
    isPercentage: boolean
  }
  
  export interface Payslip {
    id: string
    employeeId: string
    period: {
      month: number
      year: number
    }
    workingDays: number
    workedDays: number
    earnings: EarningItem[]
    deductions: DeductionItem[]
    createdAt: Date
  }
  
  