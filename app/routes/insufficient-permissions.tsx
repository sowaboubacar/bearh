import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { AlertTriangle, Mail, Home, ArrowLeft } from 'lucide-react';
import { Link } from "@remix-run/react";

export default function AccessDenied() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-3 xs:p-4 sm:p-6 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1562243061-204550d8a2c9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
    >
      <Card className="w-[calc(100%-24px)] xs:w-[360px] sm:w-[425px] max-w-[425px] p-4 xs:p-5 sm:p-6 text-center space-y-4 xs:space-y-5 sm:space-y-6 bg-white/95 backdrop-blur shadow-xl">
        <div className="space-y-2 xs:space-y-3">
          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 xs:h-7 sm:h-8 w-auto text-red-500" />
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-red-800">
            403
          </h1>
          <h2 className="text-xl xs:text-xl sm:text-2xl font-semibold text-red-700">
            Accès Refusé
          </h2>
          <p className="text-sm xs:text-base text-gray-600">
            Désolé, vous n&apos;avez pas les autorisations suffisantes pour accéder à cette ressource ou à cette partie de l&apos;application.
          </p>
        </div>

        <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4 justify-center">
          <Button
            variant="outline"
            asChild
            className="h-9 xs:h-10 gap-1.5 xs:gap-2 bg-white text-red-700 border-red-700 hover:bg-red-50 text-xs xs:text-sm"
          >
            <Link to="/">
              <Home className="h-3.5 w-3.5 xs:w-4 xs:h-4" />
              Accueil
            </Link>
          </Button>
          <Button 
            asChild 
            className="h-9 xs:h-10 gap-1.5 xs:gap-2 bg-red-600 hover:bg-red-700 text-white text-xs xs:text-sm"
          >
            <Link  rel="noreferrer" to="https://pharmacievaldoise.fr/contact" target="_blank">
              <Mail className="h-3.5 w-3.5 xs:w-4 xs:h-4" />
              Contacter le Support
            </Link>
          </Button>
        </div>

        <footer className="text-[11px] xs:text-xs sm:text-sm text-gray-600 pt-4 xs:pt-5 sm:pt-6 border-t border-gray-200">
          Code d&apos;erreur: 403 - Accès Interdit
        </footer>
      </Card>
    </div>
  );
}

