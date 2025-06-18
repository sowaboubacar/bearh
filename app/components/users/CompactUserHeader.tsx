import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import type { IUser } from "~/core/entities/user.entity.server";
import { Link } from "@remix-run/react";
import { ArrowLeft, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";

interface CompactUserHeaderProps {
  user: IUser;
  can?: {
    list?: boolean;
    view?: boolean;
  }
}



export function CompactUserHeader({ user, can }: CompactUserHeaderProps) {
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {can?.view && (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full sm:w-auto"
      >
        <Button
          asChild
          variant="ghost"
          className="group w-full sm:w-auto h-12 text-base hover:bg-primary/10 transition-all duration-300"
        >
          <Link
            prefetch="intent"
            to={`/o/users/view/${user.id}`}
            className="flex items-center justify-center sm:justify-start space-x-2 text-primary"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Retour au profil</span>
          </Link>
        </Button>
      </motion.div>
      )}

      <Card className="overflow-hidden rounded-full">
        <div className="rounded-full shadow-2xl border-2 border-primary p-1">
          <div className=" dark:bg-gray-800 ">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-2">
              <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                <AvatarImage
                  src={user.avatar?.file?.url}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {user.firstName ? user.firstName[0].toUpperCase() : ""}
                  {user.lastName ? user.lastName[0].toUpperCase() : ""}
                </AvatarFallback>
              </Avatar>

              <CardHeader className="p-0 space-y-1 text-center sm:text-left">
                <CardTitle className="text-2xl font-bold">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <div className="flex items-center justify-center sm:justify-start space-x-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <p className="text-sm">
                    {user.currentPosition?.title ?? "Aucun poste"}
                  </p>
                </div>
              </CardHeader>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}


