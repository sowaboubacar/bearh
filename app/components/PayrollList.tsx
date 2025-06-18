import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";

interface Payroll {
  id: string;
  employeeName: string;
  month: string;
  grossTotal: number;
  netToPay: number;
  status: "generated" | "updated" | "validated";
}

interface PayrollListProps {
  payrolls: Payroll[];
  onViewDetails: (id: string) => void;
}

const PayrollList: React.FC<PayrollListProps> = ({ payrolls, onViewDetails }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Month</TableHead>
          <TableHead>Gross Total</TableHead>
          <TableHead>Net To Pay</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payrolls.map((payroll) => (
          <TableRow key={payroll.id}>
            <TableCell>{payroll.employeeName}</TableCell>
            <TableCell>{payroll.month}</TableCell>
            <TableCell>{payroll.grossTotal.toFixed(2)}</TableCell>
            <TableCell>{payroll.netToPay.toFixed(2)}</TableCell>
            <TableCell>{payroll.status}</TableCell>
            <TableCell>
              <button onClick={() => onViewDetails(payroll.id)}>View Details</button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PayrollList; 