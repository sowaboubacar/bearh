import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Award, ChevronRight } from "lucide-react";
import type { IUser } from "~/core/entities/user.entity.server";
import { IEmployeeOfTheMonth } from "~/core/entities/employeeOfTheMonth.entity.server";


export function EmployeeOfTheMonth({ employeeOfThisMonth }: { employeeOfThisMonth: IEmployeeOfTheMonth }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  if(!employeeOfThisMonth) return;

  const user = employeeOfThisMonth.employee;


  return (
    <motion.div
      className="bg-gradient-to-r from-primary to-primary-400 p-2 rounded-full shadow-2xl border-2 border-primary flex items-center space-x-2 cursor-pointer"
      onClick={() => navigate(`/o/hall-of-fame/${employeeOfThisMonth.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Award className="h-5 w-5 text-yellow-300" />
      <Avatar className="h-8 w-8 border-2 border-white">
        <AvatarImage src={user.avatar?.file?.url} alt={user.firstName} />
        {(user.firstName + " " + user.lastName)
          .split(" ")
          .map((n) => n[0])
          .join("")}
      </Avatar>
      <div className="flex-grow">
        <p className="text-white text-xs font-semibold truncate">
          {user.firstName} {user.lastName}
        </p>
        <Badge variant="secondary" className="text-[10px] px-1 py-0 text-pretty">
          {employeeOfThisMonth.message.split(" ").slice(0, 3).join(" ")}...
        </Badge>
      </div>
      <motion.div
        animate={{ rotate: isHovered ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight className="h-4 w-4 text-red-800" />
      </motion.div>
    </motion.div>
  );
}
