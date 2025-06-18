import { FileX2, Plus, Grid, List, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface NoDataMessageProps {
  type?: string;
  createLink?: string;
  view: "grid" | "list" | "pills" | "timeline";
}

export default function NoDataMessage({
  type = "",
  createLink = "",
  view,
}: NoDataMessageProps) {
  const getIcon = () => {
    switch (view) {
      case "grid":
        return <Grid className="h-8 sm:h-10 w-8 sm:w-10 text-muted-foreground" />;
      case "list":
        return <List className="h-6 sm:h-7 w-6 sm:w-7 text-muted-foreground" />;
      case "pills":
        return <Clock className="h-7 sm:h-8 w-7 sm:w-8 text-muted-foreground" />;
      case "timeline":
        return <FileX2 className="h-7 sm:h-8 w-7 sm:w-8 text-muted-foreground" />;
      default:
        return <FileX2 className="h-7 sm:h-8 w-7 sm:w-8 text-muted-foreground" />;
    }
  };

  const getIconContainerSize = () => {
    switch (view) {
      case "grid":
        return "w-16 sm:w-20 h-16 sm:h-20";
      case "list":
        return "w-12 sm:w-14 h-12 sm:h-14";
      case "pills":
      case "timeline":
        return "w-14 sm:w-16 h-14 sm:h-16";
      default:
        return "w-14 sm:w-16 h-14 sm:h-16";
    }
  };

  const getTitleSize = () => {
    switch (view) {
      case "grid":
        return "text-xl sm:text-2xl lg:text-3xl";
      case "list":
        return "text-lg sm:text-xl lg:text-2xl";
      case "pills":
      case "timeline":
        return "text-xl sm:text-2xl";
      default:
        return "text-xl sm:text-2xl";
    }
  };

  return (
    <Card
      className={`w-full mx-auto text-center ${
        view === "grid" ? "max-w-sm sm:max-w-md" : "max-w-full"
      }`}
    >
      <CardHeader className="p-4 sm:p-6">
        <div
          className={`mx-auto my-4 sm:my-6 ${getIconContainerSize()} bg-muted rounded-full flex items-center justify-center`}
        >
          {getIcon()}
        </div>
        <CardTitle className={`${getTitleSize()} font-semibold`}>
          Aucune donnée trouvée
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <p className="text-muted-foreground text-base sm:text-lg">
          Pour le moment, il n'y a pas encore d'informations à afficher ici.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center p-4 sm:p-6">
        <Button 
          asChild 
          size={view === "list" ? "default" : "lg"}
          className="h-10 sm:h-11 text-base"
        >
          {createLink !== "" ? (
            <a href={createLink}>
              <Plus
                className={`mr-2 ${
                  view === "list" ? "h-4 w-4 sm:h-5 sm:w-5" : "h-5 w-5 sm:h-6 sm:w-6"
                }`}
              />
              {view === "grid" ? "Créer une nouvelle entrée" : "Nouvelle"}
            </a>
          ) : (
            <></>
          )}
        </Button>
      </CardFooter>
    </Card>
  );  
}
