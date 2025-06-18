import React from "react";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";

interface Deduction {
  id: string;
  name: string;
  type: "fixed" | "proportional";
  value: number;
}

interface DeductionTableProps {
  deductions: Deduction[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const DeductionTable: React.FC<DeductionTableProps> = ({ deductions, onEdit, onDelete }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deductions.map((deduction) => (
          <TableRow key={deduction.id}>
            <TableCell>{deduction.name}</TableCell>
            <TableCell>{deduction.type}</TableCell>
            <TableCell>{deduction.value}</TableCell>
            <TableCell>
              <Button onClick={() => onEdit(deduction.id)}>Edit</Button>
              <Button onClick={() => onDelete(deduction.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DeductionTable; 