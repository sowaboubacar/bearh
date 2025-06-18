import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface PayrollConfigFormProps {
  onSubmit: (data: any) => void;
}

const PayrollConfigForm: React.FC<PayrollConfigFormProps> = ({ onSubmit }) => {
  const { register, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="smig" className="block text-sm font-medium">
          SMIG (Minimum Wage)
        </label>
        <Input
          type="number"
          id="smig"
          {...register("smig", { required: true })}
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <label htmlFor="cnps" className="block text-sm font-medium">
          CNPS Contribution (%)
        </label>
        <Input
          type="number"
          id="cnps"
          {...register("contributions.cnps", { required: true })}
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <label htmlFor="amu" className="block text-sm font-medium">
          AMU Contribution (%)
        </label>
        <Input
          type="number"
          id="amu"
          {...register("contributions.amu", { required: true })}
          className="mt-1 block w-full"
        />
      </div>

      <Button type="submit" className="w-full">
        Save Configuration
      </Button>
    </form>
  );
};

export default PayrollConfigForm; 