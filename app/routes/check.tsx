import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  UserCheck,
  UserMinus,
  Coffee,
  Search,
  Info,
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { useToast } from "~/hooks/use-toast";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import {
  LoaderFunction,
  ActionFunction,
  LinksFunction,
  HeadersFunction,
} from "@remix-run/node";
import { attendanceService } from "~/services/attendance.service.server";
import { userService } from "~/services/user.service.server";
import { authService } from "~/services/auth.service.server";
import { Badge } from "~/components/ui/badge";
import { motion } from "framer-motion";



export const links: LinksFunction = () => [
  {
    rel: "preload",
    as: "image",
    href: "https://images.unsplash.com/photo-1562243061-204550d8a2c9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const ITEMS_PER_PAGE = 12;

export const loader: LoaderFunction = async ({ request }) => {

  await authService.requiredSharedAuth(request); // Will redirect to /shared-auth if not authenticated

  try {
    const employees = await userService.readMany(
      {},
      { populate: "avatar,supervisors,access" }
    );

    return Response.json({ employees });
  } catch (error) {
    console.error("Error in loader:", error);
    return Response.json(
      { error: "An error occurred while loading the data." },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requiredSharedAuth(request); 
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const pin = formData.get("pin") as string;
    const actionType = formData.get("actionType") as
      | "checkIn"
      | "checkOut"
      | "breakStart"
      | "breakEnd";

    const isPinValid = await userService.verifyPin(userId, pin);
    if (!isPinValid) {
      return Response.json(
        {
          success: false,
          message: "PIN incorrect ou vous n'êtes pas cette personne.",
        },
        { status: 400 }
      );
    }

    const newRecord = await attendanceService.addEntry(userId, actionType);
    const user = await userService.readOne({ id: userId });

    let newStatus = user.status;
    if (actionType === "checkIn") newStatus = "present";
    else if (actionType === "checkOut") newStatus = "absent";
    else if (actionType === "breakStart") newStatus = "onBreak";
    else if (actionType === "breakEnd") newStatus = "present";

    await userService.updateOne(userId, { status: newStatus });

    return Response.json({
      success: true,
      record: newRecord.toObject(),
      user: user.toObject(),
      actionType,
    });
  } catch (error) {
    console.error("Error in action:", error);
    return Response.json(
      {
        success: false,
        message: "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
};

export default function AttendancePage() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [pin, setPin] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState(loaderData.employees || []);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loaderData && !loaderData.error) {
      setIsLoading(false);
      setEmployees(loaderData.employees || []);
    }
  }, [loaderData]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setPin("");
    setIsDialogOpen(true);
  };

  const handlePinSubmit = (action) => {
    if (pin?.length !== 4) {
      toast({
        title: "Code PIN invalide",
        description: "Veuillez entrer un code PIN à 4 chiffres.",
        variant: "destructive",
      });
      return;
    }

    let actionType: "checkIn" | "checkOut" | "breakStart" | "breakEnd";
    switch (action) {
      case "Arrivée":
        actionType = "checkIn";
        break;
      case "Départ":
        actionType = "checkOut";
        break;
      case "Début de pause":
        actionType = "breakStart";
        break;
      case "Fin de pause":
        actionType = "breakEnd";
        break;
    }

    fetcher.submit(
      { userId: selectedEmployee.id, pin, actionType },
      { method: "post" }
    );
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setError(null);
    setPin("");
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
      const { record, user, actionType } = fetcher.data;

      const actionVerbMap = {
        checkIn: "êtes arrivé(e)",
        checkOut: "êtes parti(e)",
        breakStart: "avez commencé votre pause",
        breakEnd: "avez terminé votre pause",
      };
      const actionVerb = actionVerbMap[actionType] || "";

      const feedbackMessages = [
        `Pointage reçu ! Vous ${actionVerb} à ${currentTime.toLocaleTimeString()}.`,
        `Merci pour votre ponctualité ! Votre action a été enregistrée.`,
        `Bonne journée ! Votre action est bien notée.`,
        `Excellent ! Votre présence est importante pour nous.`,
      ];

      setFeedbackMessage(
        feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]
      );
      setIsDialogOpen(false);
      setIsFeedbackModalOpen(true);
      setSelectedEmployee(null);
      setPin("");

      // Update the employees state
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) =>
          emp.id === user.id ? { ...emp, status: user.status } : emp
        )
      );
    } else if (fetcher.data && !fetcher.data.success) {
      setError(fetcher.data.message);
    }
  }, [fetcher.data]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-pharmacy-background bg-cover bg-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-white bg-black bg-opacity-50 p-4 rounded-lg"
        >
          Chargement...
        </motion.div>
      </div>
    );
  }

  if (loaderData.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{loaderData.error}</AlertDescription>
      </Alert>
    );
  }

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEmployeePages = Math.ceil(
    filteredEmployees.length / ITEMS_PER_PAGE
  );
  const paginatedEmployees = filteredEmployees.slice(
    (currentEmployeePage - 1) * ITEMS_PER_PAGE,
    currentEmployeePage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen w-full overflow-x-scroll  bg-[url('https://images.unsplash.com/photo-1562243061-204550d8a2c9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center">
      <div className="min-h-screen w-full bg-primary/50 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-7xl px-3 py-4 xs:px-4 sm:px-6 lg:px-8 sm:py-6 lg:py-8">
          <header className="mb-4 flex flex-col xs:flex-row justify-between items-center gap-3 bg-white/80 p-3 xs:p-4 rounded-lg backdrop-blur-sm sm:mb-6 lg:mb-8">
            <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
              Pointage
            </h1>
            <Link
              to="/login"
              className="inline-flex items-center text-xs xs:text-sm text-primary hover:text-primary-dark transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-3 w-3 xs:h-4 xs:w-4" />
              Accéder à l&apos;espace personnel
            </Link>
          </header>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 xs:p-4 sm:p-5 lg:p-6 mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <Info className="h-4 w-4 xs:h-5 xs:w-5 mr-2 text-primary" />
              <p className="text-center text-sm xs:text-base sm:text-lg text-primary-dark">
                Veuillez simplement cliquer sur votre avatar pour pointer.
              </p>
            </div>
            <div className="relative mb-4 sm:mb-6">
              <Input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 xs:pl-10 pr-4 py-2 h-9 xs:h-10 text-xs xs:text-sm w-full bg-white/50 backdrop-blur-sm focus:bg-white transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 xs:h-5 xs:w-5 text-primary" />
            </div>
            <ScrollArea className="">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 },
                  },
                }}
                className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 xs:gap-3 sm:gap-4"
              >
                {paginatedEmployees.map((employee) => (
                  <motion.div
                    key={employee.id}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 },
                    }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-auto p-2 xs:p-3 sm:p-4 flex flex-col items-center space-y-1.5 xs:space-y-2 hover:bg-primary-50 transition-colors rounded-lg shadow-md hover:shadow-lg bg-white/90"
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      <Avatar className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 border-2 border-primary">
                        <AvatarImage
                          src={employee.avatar?.file?.url}
                          alt={`${employee.firstName} ${employee.lastName}`}
                        />
                        <AvatarFallback className="text-lg xs:text-xl sm:text-2xl bg-primary-100 text-primary-700">
                          {employee.firstName[0]}
                          {employee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs xs:text-sm font-semibold text-center text-primary-800">
                        {employee.firstName} {employee.lastName}
                      </span>
                      {employee.position && (
                        <Badge
                          variant="secondary"
                          className="mt-0.5 xs:mt-1 text-[10px] xs:text-xs bg-primary-100 text-primary-700"
                        >
                          {employee.position}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          employee.status === "present"
                            ? "success"
                            : employee.status === "absent"
                            ? "destructive"
                            : employee.status === "onBreak"
                            ? "warning"
                            : "default"
                        }
                        className="mt-0.5 xs:mt-1 text-[10px] xs:text-xs"
                      >
                        {employee.status}
                      </Badge>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            </ScrollArea>
            <div className="flex justify-between items-center mt-4 sm:mt-6">
              <Button
                onClick={() =>
                  setCurrentEmployeePage((prev) => Math.max(prev - 1, 1))
                }
                disabled={currentEmployeePage === 1}
                variant="outline"
                size="sm"
                className="h-8 xs:h-9 text-xs xs:text-sm bg-white hover:bg-primary-50"
              >
                <ChevronLeft className="h-3 w-3 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                Précédent
              </Button>
              <span className="text-xs xs:text-sm text-primary-700">
                Page {currentEmployeePage} sur {totalEmployeePages}
              </span>
              <Button
                onClick={() =>
                  setCurrentEmployeePage((prev) =>
                    Math.min(prev + 1, totalEmployeePages)
                  )
                }
                disabled={currentEmployeePage === totalEmployeePages}
                variant="outline"
                size="sm"
                className="h-8 xs:h-9 text-xs xs:text-sm bg-white hover:bg-primary-50"
              >
                Suivant
                <ChevronRight className="h-3 w-3 xs:h-4 xs:w-4 ml-1.5 xs:ml-2" />
              </Button>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="w-[calc(100%-24px)] xs:w-[425px] max-w-[425px] p-4 xs:p-6 bg-white/95 backdrop-blur-md">
              <DialogHeader>
                <DialogTitle className="text-xl xs:text-2xl font-bold text-center text-primary-700">
                  Pointage
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 xs:space-y-6">
                <div className="text-center">
                  <time
                    className="text-sm xs:text-base font-semibold text-primary-700"
                    dateTime={currentTime.toISOString()}
                  >
                    {currentTime.toLocaleTimeString()}
                  </time>
                </div>
                {selectedEmployee && (
                  <div className="space-y-4 xs:space-y-6">
                    <div className="text-center">
                      <Avatar className="w-24 h-24 xs:w-32 xs:h-32 mx-auto border-4 border-primary">
                        <AvatarImage
                          src={selectedEmployee.avatar?.file?.url}
                          alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                        />
                        <AvatarFallback className="text-2xl xs:text-4xl bg-primary-100 text-primary-700">
                          {selectedEmployee.firstName[0]}
                          {selectedEmployee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h2 className="mt-3 xs:mt-4 text-xs xs:text-sm font-semibold text-primary-800">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </h2>
                      {selectedEmployee.position && (
                        <p className="text-xs xs:text-sm text-primary-600">
                          {selectedEmployee.position}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3 xs:space-y-4">
                      <Label
                        htmlFor="pin"
                        className="text-xs xs:text-sm font-bold text-primary-700"
                      >
                        Entrez votre code PIN
                      </Label>
                      {error && (
                        <Alert variant="destructive">
                          <AlertTitle className="text-xs xs:text-sm">
                            Erreur
                          </AlertTitle>
                          <AlertDescription className="text-xs xs:text-sm">
                            {error}
                          </AlertDescription>
                        </Alert>
                      )}
                      <Input
                        id="pin"
                        type="password"
                        placeholder="****"
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value);
                          setError(null);
                        }}
                        maxLength={4}
                        className={`text-center text-xl xs:text-2xl h-12 ${
                          error ? "shake" : ""
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 xs:gap-4">
                      <Button
                        onClick={() => handlePinSubmit("Arrivée")}
                        className="h-14 xs:h-16 text-base xs:text-lg bg-primary hover:bg-primary-dark text-white"
                      >
                        <UserCheck className="w-5 h-5 xs:w-6 xs:h-6 mr-1.5 xs:mr-2" />
                        Arrivée
                      </Button>
                      <Button
                        onClick={() => handlePinSubmit("Départ")}
                        className="h-14 xs:h-16 text-base xs:text-lg bg-red-500 hover:bg-red-600 text-white"
                      >
                        <UserMinus className="w-5 h-5 xs:w-6 xs:h-6 mr-1.5 xs:mr-2" />
                        Départ
                      </Button>
                      <Button
                        onClick={() => handlePinSubmit("Début de pause")}
                        className="h-14 xs:h-16 text-base xs:text-lg bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <Coffee className="w-5 h-5 xs:w-6 xs:h-6 mr-1.5 xs:mr-2" />
                        Début de pause
                      </Button>
                      <Button
                        onClick={() => handlePinSubmit("Fin de pause")}
                        className="h-14 xs:h-16 text-base xs:text-lg bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Coffee className="w-5 h-5 xs:w-6 xs:h-6 mr-1.5 xs:mr-2" />
                        Fin de pause
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isFeedbackModalOpen}
            onOpenChange={setIsFeedbackModalOpen}
          >
            <DialogContent className="w-[calc(100%-24px)] xs:w-[425px] max-w-[425px] p-4 xs:p-6 bg-white/95 backdrop-blur-md">
              <DialogHeader>
                <DialogTitle className="text-xl xs:text-2xl font-bold text-center text-primary-600">
                  Pointage Réussi
                </DialogTitle>
              </DialogHeader>
              <div className="text-center space-y-4 xs:space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <CheckCircle className="w-20 h-20 xs:w-24 xs:h-24 mx-auto text-primary" />
                </motion.div>
                <p className="text-lg xs:text-xl text-primary-700">
                  {feedbackMessage}
                </p>
                <Button
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="w-full h-10 xs:h-12 text-base xs:text-lg bg-primary hover:bg-primary-dark text-white"
                >
                  Fermer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 z-50 rounded-full w-12 h-12 bg-secondary hover:bg-primary-dark text-dark shadow-lg"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-6 w-6" />
            ) : (
              <Maximize2 className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
