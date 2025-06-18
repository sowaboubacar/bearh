import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { IUser } from "~/core/entities/user.entity.server";
import type { IKpiForm } from "~/core/entities/kpiForm.entity.server";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: IUser;
  applicableKpis?: IKpiForm[];
}

export function EvaluationModal({
  isOpen,
  onClose,
  user,
  applicableKpis = [],
}: EvaluationModalProps) {
  const [selectedKpi, setSelectedKpi] = useState("");
  const fetcher = useFetcher();
  const [error, setError] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});

  const selectedForm = applicableKpis.find((kpi) => kpi.id === selectedKpi);

  const handleSubmit = () => {
    // Transform the scores object into an array of { criterionName, score }
    const kpiScores = Object.entries(scores).map(([criterionName, score]) => ({
      criterionName,
      score,
    }));

    const formData = new FormData();
    formData.append("kpiForm", selectedKpi);
    formData.append("user", user?.id as string);
    // Send scores as an array of IKpiScore
    formData.append("scores", JSON.stringify(kpiScores));

    fetcher.submit(formData, { method: "POST", action: "/api/kpi" });
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
      onClose();
    } else if (fetcher.data && fetcher.data.error) {
      setError(fetcher.data.error);
    }
  }, [fetcher.data]);

  const handleScoreChange = (criterionKey: string, score: number, maxScore: number) => {
    if (score > maxScore) {
      setScores((prevScores) => ({
        ...prevScores,
        [criterionKey]: maxScore,
      }));
    } else {
      setScores((prevScores) => ({
        ...prevScores,
        [criterionKey]: score,
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Set a max-height and overflow scroll to handle long forms gracefully */}
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Évaluer {user.firstName} {user.lastName}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-red-500 text-sm font-semibold py-4">{error}</div>
        )}

        {applicableKpis && applicableKpis.length > 0 ? (
          <>
            <div className="py-4">
              <Select value={selectedKpi} onValueChange={setSelectedKpi}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue
                    placeholder="Sélectionnez un formulaire KPI"
                    className="text-base"
                  />
                </SelectTrigger>
                <SelectContent>
                  {applicableKpis.map((form) => (
                    <SelectItem
                      key={form.id}
                      value={form.id}
                      className="text-base py-3"
                    >
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedForm && (
              <div className="py-4 space-y-4">
                <h3 className="font-semibold text-lg">{selectedForm.title}</h3>
                {selectedForm.criteria.map((criterion) => (
                  <div key={criterion.name} className="space-y-2">
                    <Label htmlFor={criterion.name}>{criterion.name}</Label>
                    {/* Description of the criterion */}
                    {criterion.description && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {criterion.description}
                      </p>
                    )}
                    <Input
                      id={criterion.name}
                      type="number"
                      min="0"
                      max={criterion.maxScore}
                      value={scores[criterion.name] ?? ""}
                      onChange={(e) =>
                        handleScoreChange(
                          criterion.name,
                          Number(e.target.value),
                          criterion.maxScore
                        )
                      }
                      className="h-11"
                    />
                    <p className="text-sm text-muted-foreground">
                      Max score: {criterion.maxScore}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter className="gap-3 sm:gap-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto h-11 text-base"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedKpi}
                className="w-full sm:w-auto h-11 text-base"
              >
                Évaluer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="text-center text-sm font-semibold py-4">
            Aucun formulaire KPI disponible pour cet employé
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
