import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import type { ITask } from '~/core/entities/task.entity.server'

interface UserTasksProps {
  tasks: ITask[]
}

export function UserTasks({ tasks }: UserTasksProps) {

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Tâches
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {tasks && tasks.map((task) => (
            <div 
              key={task.id} 
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-lg hover:bg-muted/50"
            >
              <Checkbox 
                checked={task.status === 'completed'} 
                className="h-5 w-5 sm:h-6 sm:w-6"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold line-clamp-1">
                  {task.title}
                </h3>
                <p className="text-base text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              </div>
              <div className="flex flex-row sm:flex-col items-start sm:items-end gap-3 sm:gap-2 ml-8 sm:ml-0">
                <Badge 
                  variant={
                    task.priority === 'high' 
                      ? 'destructive' 
                      : task.priority === 'medium' 
                      ? 'default' 
                      : 'secondary'
                  }
                  className="text-base px-3 py-1"
                >
                  {task.priority}
                </Badge>
                <span className="text-base text-muted-foreground whitespace-nowrap">
                  {new Date(task.dueDate).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )  
}

