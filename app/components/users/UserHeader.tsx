import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { IUser } from "~/core/entities/user.entity.server";
import { Award, Key, Mail, UserCheck, Users } from "lucide-react";
import { IEmployeeOfTheMonth } from "~/core/entities/employeeOfTheMonth.entity.server";
import { Link } from "@remix-run/react";

interface UserHeaderProps {
  user: IUser;
  isWinner?: { isWinner: boolean; item: IEmployeeOfTheMonth };
}

export function UserHeader({ user, isWinner }: UserHeaderProps) {
  if (!user) return null;

  console.log("Is Winner", isWinner);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        className={`overflow-hidden ${
          isWinner?.isWinner ? "ring-4 ring-yellow-400" : ""
        }`}
      >
        <div className="bg-gradient-to-r from-primary to-secondary p-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl">
            <CardHeader className="flex flex-col md:flex-row items-center gap-6 p-6">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                  <AvatarImage
                    src={user.avatar?.file?.url}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                  <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {isWinner?.isWinner && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Award className="h-6 w-6 text-primary" />
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {isWinner?.isWinner ? isWinner?.item.message : ``}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </motion.div>

              <div className="text-center md:text-left space-y-2">
                <CardTitle className="text-3xl md:text-4xl font-bold text-primary">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {user.currentPosition?.title || "Aucun poste"}
                </Badge>
                {isWinner?.isWinner && (
                  <>
                    <Badge
                      variant="outline"
                      className="bg-yellow-400 text-primary border-yellow-500 ml-2"
                    >
                      Employé du mois
                    </Badge>

                    
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </p>
                <p className="text-lg font-medium break-all">{user.email}</p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Statut
                </p>
                {user.status && (
                  <Badge
                    variant="outline"
                    className="text-base bg-emerald-100 text-emerald-800 border-emerald-200"
                  >
                    {user.status}
                  </Badge>
                )}
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Superviseur(s)
                </p>
                {user.supervisors && user.supervisors.length > 0 ? (
                  <ul className="space-y-1">
                    {user.supervisors.map((supervisor) => (
                      <li
                        key={supervisor?.id}
                        className="text-base font-medium"
                      >
                        {supervisor?.firstName} {supervisor?.lastName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base font-medium">Aucun superviseur</p>
                )}
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="space-y-2 sm:col-span-2 lg:col-span-3"
              >
                <p className="text-sm text-muted-foreground flex items-center">
                  <Key className="mr-2 h-4 w-4" />
                  Droit d'Accès
                </p>
                <p className="text-lg font-medium">
                  {user.access?.name || "Non défini"}
                </p>
                {
                  isWinner?.isWinner && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-400 text-primary border-yellow-500 ml-2"
                    >
                      <Link
                        to={`/o/hall-of-fame/${isWinner?.item?.id}`}
                        className="text-primary underline"
                      >
                        Consulter les réalisations
                      </Link>
                    </Badge>
                  )
                }
              </motion.div>
            </CardContent>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
