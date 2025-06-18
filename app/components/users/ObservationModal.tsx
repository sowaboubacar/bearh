import { useEffect, useState } from "react";
import { Form, useFetcher } from "@remix-run/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import type { IUser } from "~/core/entities/user.entity.server";
import { Label } from "@radix-ui/react-label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { CardContent, CardFooter } from "../ui/card";
interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: IUser;
}

export function ObservationModal({
  isOpen,
  onClose,
  user,
}: ObservationModalProps) {
  const [observation, setObservation] = useState("");
  const [type, setType] = useState("Positive");
  const [error, setError] = useState("");
  const fetcher = useFetcher();
  const [modalOpened, setModalOpened] = useState(isOpen);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("content", observation);
    formData.append("user", user?.id as string);
    fetcher.submit(formData, { method: "POST", action: "/api/observation" });
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
     onClose();
    } else if (fetcher.data && fetcher.data.error) {
      setError(fetcher.data.error);
    }
  }, [fetcher.data]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Une remarque à {user.firstName} {user.lastName}
          </DialogTitle>
        </DialogHeader>

        <Form method="post" onSubmit={handleSubmit}>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-base font-medium">
                  Erreur
                </AlertTitle>
                <AlertDescription className="text-base">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="py-4">
            <Label htmlFor="type" className="text-base font-medium">
                Type de Remarque
              </Label>
              <Select
                value={type}
                name="type"
                required
                onValueChange={(value) => setType(value)}
              >
                <SelectTrigger className="w-full h-11">
                  <SelectValue
                    placeholder="Type de remarque"
                    className="text-base"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Positive" className="text-base py-3">
                    Positive
                  </SelectItem>

                  <SelectItem value="Negative" className="text-base py-3">
                    Négative
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="content" className="text-base font-medium">
                Contenu
              </Label>
              <Textarea
                id="content"
                name="content"
                required
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Entrez votre observation ici..."
                className="min-h-[150px] text-base p-3 resize-none"
              />
            </div>
          </CardContent>

          <CardFooter className="p-4 sm:p-6">
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Remarques en cours...
                </span>
              ) : (
                "Faire la remarque"
              )}
            </Button>
          </CardFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
