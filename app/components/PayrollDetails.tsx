import React from "react";
import { Button } from "~/components/ui/button";

interface PayrollDetailsProps {
  payroll: {
    employeeName: string;
    month: string;
    baseSalary: number;
    allowances: { id: string; name: string; amount: number }[];
    deductions: { id: string; name: string; amount: number }[];
    overtime: number;
    grossTotal: number;
    socialCharges: number;
    netToPay: number;
    status: "generated" | "updated" | "validated";
  };
  onEdit: () => void;
  onSave: () => void;
}

const PayrollDetails: React.FC<PayrollDetailsProps> = ({ payroll, onEdit, onSave }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Payroll Details for {payroll.employeeName}</h2>
      <p>Month: {payroll.month}</p>
      <p>Base Salary: {payroll.baseSalary.toFixed(2)}</p>
      <p>Overtime: {payroll.overtime.toFixed(2)}</p>
      <p>Gross Total: {payroll.grossTotal.toFixed(2)}</p>
      <p>Social Charges: {payroll.socialCharges.toFixed(2)}</p>
      <p>Net To Pay: {payroll.netToPay.toFixed(2)}</p>
      <p>Status: {payroll.status}</p>

      <h3 className="text-lg font-semibold">Allowances</h3>
      <ul>
        {payroll.allowances.map((allowance) => (
          <li key={allowance.id}>{allowance.name}: {allowance.amount.toFixed(2)}</li>
        ))}
      </ul>

      <h3 className="text-lg font-semibold">Deductions</h3>
      <ul>
        {payroll.deductions.map((deduction) => (
          <li key={deduction.id}>{deduction.name}: {deduction.amount.toFixed(2)}</li>
        ))}
      </ul>

      <div className="flex space-x-2">
        <Button onClick={onEdit}>Edit</Button>
        <Button onClick={onSave}>Save</Button>
      </div>
    </div>
  );
};

export default PayrollDetails; 