import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import { CheckCircle2, XCircle, Shield } from 'lucide-react'
import type { IAccess } from '~/core/entities/access.entity.server'
import { permissionCategories } from '~/core/entities/utils/access-permission'

interface UserAccessProps {
  access: IAccess
}

export function UserAccess({ access }: UserAccessProps) {
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null)

  const toggleAccordion = (category: string) => {
    setActiveAccordion(activeAccordion === category ? null : category)
  }
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-center text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white flex items-center justify-center">
          <Shield className="mr-3 h-6 w-6" />
          Droits d'accès
        </CardTitle>
      </CardHeader>
  
      {access && (
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
              Description
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {access.description || "Aucune description fournie"}
            </p>
          </div>
  
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
              Permissions
            </h2>
            <Accordion 
              type="single" 
              collapsible 
              className="w-full space-y-2"
            >
              {Object.entries(permissionCategories).map(([category, { label, actions }]) => (
                <AccordionItem 
                  key={category} 
                  value={category}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger 
                    onClick={() => toggleAccordion(category)}
                    className="py-4 text-base font-medium"
                  >
                    {label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <ul className="space-y-3">
                      {Object.entries(actions).map(([action, actionLabel]) => (
                        <li key={action} className="flex items-center gap-3">
                          {access.permissions.includes(`${category}.${action}`) ? (
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                          ) : (
                            <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                          )}
                          <span className="text-base text-gray-600 dark:text-gray-400">
                            {actionLabel}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
  
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                Créé le
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400">
                {new Date(access.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                Mis à jour le
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400">
                {new Date(access.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );  
}

