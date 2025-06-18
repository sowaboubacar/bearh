import { useEffect, useState } from 'react'
import { useFetcher, useNavigate } from '@remix-run/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { IUser } from '~/core/entities/user.entity.server'
import { ITask } from '~/core/entities/task.entity.server'

interface TaskAssignModalProps {
  isOpen: boolean
  onClose: () => void
  user: IUser;
  tasks?: ITask[]
}

export function TaskAssignModal({ isOpen, onClose, user, tasks = []}: TaskAssignModalProps) {
  const [selectedTask, setSelectedTask] = useState('')
  const [intent, setIntent] = useState('quickAssignNewTask')
  const fetcher = useFetcher();
  const [error, setError] = useState('')

  const handleSubmit = () => {
    
    if(intent=="quickAssign"){
      const formData = new FormData();
      formData.append('_action','quickAssign')
      formData.append("user", user?.id as string);
      formData.append("task", selectedTask as string);
      fetcher.submit(formData, { method: "POST", action: "/api/task" });
      return;
    }
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
      console.log('Data: ', fetcher.data)
      onClose();
    } else if (fetcher.data && fetcher.data.error) {
      setError(fetcher.data.error);
    }
  }, [fetcher.data]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Assigner une tâche
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-red-500 text-sm font-semibold py-4">{error}</div>
        )}
  
        <div className="py-4">
          <Select value={selectedTask} onValueChange={
            (value)=> {
              setSelectedTask(value);
              setIntent('quickAssign');
            }
          }>
            <SelectTrigger className="w-full h-11">
              <SelectValue 
                placeholder="Sélectionnez une tâche" 
                className="text-base"
              />
            </SelectTrigger>
            <SelectContent>
              {tasks?.length >0 && tasks.map((task) => (
                <SelectItem 
                  key={task.id} 
                  value={task.id as string}
                  className="text-base py-3"
                >
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
  
        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto h-11 text-base"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedTask}
            className="w-full sm:w-auto h-11 text-base"
          >
            Assigner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );  
}

