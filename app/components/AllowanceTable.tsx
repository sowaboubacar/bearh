import React from "react";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";

interface Allowance {
  id: string;
  name: string;
  type: "fixed" | "percentage";
  value: number;
}

interface AllowanceTableProps {
  allowances: Allowance[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const AllowanceTable: React.FC<AllowanceTableProps> = ({ allowances, onEdit, onDelete }) => {
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
        {allowances.map((allowance) => (
          <TableRow key={allowance.id}>
            <TableCell>{allowance.name}</TableCell>
            <TableCell>{allowance.type}</TableCell>
            <TableCell>{allowance.value}</TableCell>
            <TableCell>
              <Button onClick={() => onEdit(allowance.id)}>Edit</Button>
              <Button onClick={() => onDelete(allowance.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AllowanceTable; 