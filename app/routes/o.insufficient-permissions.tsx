import { AlertTriangle } from 'lucide-react'

export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-100 to-red-200">
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl w-full bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-10">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center animate-ping">
                  <AlertTriangle className="h-20 w-20 text-red-500 opacity-25" />
                </div>
                <AlertTriangle className="h-20 w-20 text-red-500 relative z-0" />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-6">
              Accès Refusé
            </h2>
            <p className="text-center text-gray-700 mb-6">
              Désolé, vous n&apos;avez pas les autorisations suffisantes pour accéder à cette ressource ou à cette partie de l&apos;application.
            </p>
            <p className="text-center text-gray-700 mb-8">
              Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter votre administrateur.
            </p>
            <div className="flex justify-center">
              <button className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">
                Contacter l&apos;administrateur
              </button>
            </div>
          </div>
          <div className="bg-red-600 p-4">
            <p className="text-white text-center text-sm">
              Code d&apos;erreur: 403 - Accès Interdit
            </p>
            <small className="text-white text-center text-sm">
              {new Date().toISOString()}
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

