import { useState } from "react";
import { isRouteErrorResponse, Link, useFetcher } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { AlertTriangle, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface Action {
  url: string;
  label: string;
  onClick?: () => void;
  variant?: "default" | "outline";
  intent?: "report-error";
}

interface ErrorComponentProps {
  error: unknown;
  title?: string;
  description?: string;
  actions?: Action[];
}

export function ErrorComponent({ error, title, description, actions }: ErrorComponentProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [reportUrl, setReportUrl] = useState("");
  const fetcher = useFetcher();

  const errorTitle = title || "Erreur";
  const errorDescription = description || "Une erreur inattendue s'est produite";
  const errorMessage = isRouteErrorResponse(error)
    ? error.data?.message || "Une erreur inattendue s'est produite."
    : "Une erreur inattendue s'est produite lors du chargement de la page.";
  let Icon = AlertTriangle;

  if (isRouteErrorResponse(error)) {
    if (error.status >= 500) {
      Icon = XCircle;
    } else if (error.status >= 400) {
      Icon = AlertCircle;
    }
  }

  const defaultActions: Action[] = [
    { url: "/", label: "Retour à l'accueil", variant: "outline" },
    { url: "#", label: "Réessayer", onClick: () => window.location.reload(), variant: "default" }
  ];

  const finalActions = actions || defaultActions;

  const handleReportError = (action: Action) => {
    setReportUrl(action.url);
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    fetcher.submit(formData, { method: "post", action: reportUrl });
    setIsReportModalOpen(false);
    setIsFeedbackModalOpen(true);
  };

  return (
    <div className="container mx-auto py-10 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <Icon className="mr-2 h-5 w-5" />
            {errorTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-2">{errorDescription}</p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {finalActions.map((action, index) => (
            <Button
              key={index}
              asChild={!action.onClick && !action.intent}
              variant={action.variant || (index === finalActions.length - 1 ? "default" : "outline")}
              onClick={action.intent === "report-error" ? () => handleReportError(action) : action.onClick}
            >
              {action.onClick || action.intent ? (
                <span>{action.label}</span>
              ) : (
                <Link prefetch="intent" to={action.url}>{action.label}</Link>
              )}
            </Button>
          ))}
        </CardFooter>
      </Card>

      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler une erreur</DialogTitle>
            <DialogDescription>
              Veuillez fournir des détails supplémentaires sur l'erreur que vous avez rencontrée.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReport}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" placeholder="Décrivez l'erreur en détail" required />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" name="tags" placeholder="Ex: login, performance, ui" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit">Envoyer le rapport</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Rapport d'erreur envoyé
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Merci d'avoir signalé cette erreur. Nous l'examinerons dans les plus brefs délais.
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setIsFeedbackModalOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}