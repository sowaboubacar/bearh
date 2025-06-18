import { useNavigate } from "@remix-run/react";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Award } from "lucide-react";
import { IEmployeeOfTheMonth } from "~/core/entities/employeeOfTheMonth.entity.server";



export function TinyEmployeeOfTheMonth({ employeeOfThisMonth }: { employeeOfThisMonth: IEmployeeOfTheMonth }) {
  const navigate = useNavigate();

  if(!employeeOfThisMonth) return;
  const user = employeeOfThisMonth.employee;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            {/* <p className="text-sm text-center font-semibold sm:flex-wrap">
              {employeeOfThisMonth.message.split(" ").slice(0, 3).join(" ")}...
            </p> */}
            <motion.div
              className="inline-flex items-center space-x-1 bg-primary/10 rounded-full p-1 cursor-pointer shadow-2xl border-2 border-primary"
              onClick={() => navigate(`/o/hall-of-fame/${employeeOfThisMonth.id}`)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Avatar className="h-6 w-6 border border-primary">
                <AvatarImage
                  src={user.avatar?.file?.url}
                  alt={user.firstName}
                  width={40}
                  height={40}
                />
                <AvatarFallback>
                  {" "}
                  {(user.firstName + " " + user.lastName)
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Badge
                variant="secondary"
                className="text-[10px] px-2 py-0 rounded-full truncate"
              >
                {user.firstName} {user.lastName}
              </Badge>
              <Award className="h-3 w-3  text-yellow-500 font-semibold" />
            </motion.div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm truncate"
          >{employeeOfThisMonth.message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
