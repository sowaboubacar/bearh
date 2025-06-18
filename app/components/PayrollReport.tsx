import React from "react";
import { Button } from "~/components/ui/button";

interface PayrollReportProps {
  onGenerateReport: (month: string) => void;
}

const PayrollReport: React.FC<PayrollReportProps> = ({ onGenerateReport }) => {
  const [month, setMonth] = React.useState("");

  const handleGenerate = () => {
    if (month) {
      onGenerateReport(month);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Generate Payroll Report</h2>
      <div>
        <label htmlFor="month" className="block text-sm font-medium">
          Select Month
        </label>
        <input
          type="month"
          id="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="mt-1 block w-full"
        />
      </div>
      <Button onClick={handleGenerate} className="w-full">
        Generate Report
      </Button>
    </div>
  );
};

export default PayrollReport; 