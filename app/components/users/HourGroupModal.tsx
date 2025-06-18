import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { useFetcher } from '@remix-run/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { IUser } from '~/core/entities/user.entity.server'
import { IHourGroup } from '~/core/entities/hourGroup.entity.server'

interface HourGroupModalProps {
  isOpen: boolean
  onClose: () => void
  user: IUser;
  hourGroups?: IHourGroup[];
}



export function HourGroupModal({ isOpen, onClose, user, hourGroups = [] }: HourGroupModalProps) {
  const [selectedHourGroup, setSelectedHourGroup] = useState<string>('')
  const fetcher = useFetcher();
  const [error, setError] = useState('')

  const handleSubmit = () => {
      const formData = new FormData();
      formData.append('_action','quickAssign')
      formData.append("user", user?.id as string);
      formData.append("hourGroup", selectedHourGroup as string);
      fetcher.submit(formData, { method: "POST", action: "/api/hourGroups" });    
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
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
            Ajouter à une Programmation
          </DialogTitle>
        </DialogHeader>
  
        {error && (
          <div className="text-red-500 text-sm font-semibold py-4">{error}</div>
        )}
  
        <div className="py-4">
          <Select value={selectedHourGroup} onValueChange={setSelectedHourGroup}>
            <SelectTrigger className="w-full h-11">
              <SelectValue 
                placeholder="Sélectionnez une tâche" 
                className="text-base"
              />
            </SelectTrigger>
            <SelectContent>
              {hourGroups?.length > 0 && hourGroups.map((item) => (
                <SelectItem 
                  key={item.id} 
                  value={item.id as string}
                  className="text-base py-3"
                >
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
  
        <DialogFooter className="gap-3 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto h-11 text-base"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            className="w-full sm:w-auto h-11 text-base"
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );  
}

