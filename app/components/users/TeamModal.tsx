import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { IUser } from '~/core/entities/user.entity.server'
import { ITeam } from '~/core/entities/team.entity.server'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useFetcher } from '@remix-run/react'
interface TeamModalProps {
  isOpen: boolean
  onClose: () => void
  user: IUser;
  teams?: ITeam[];
}


export function TeamModal({ isOpen, onClose, user, teams = [] }: TeamModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const fetcher = useFetcher();
  const [error, setError] = useState('')

  const handleSubmit = () => {
      const formData = new FormData();
      formData.append('_action','quickAssign')
      formData.append("user", user?.id as string);
      formData.append("team", selectedTeam as string);
      fetcher.submit(formData, { method: "POST", action: "/api/teams" });    
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
            Ajouter à un Equipe
          </DialogTitle>
        </DialogHeader>
  
        {error && (
          <div className="text-red-500 text-sm font-semibold py-4">{error}</div>
        )}
  
        <div className="py-4">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-full h-11">
              <SelectValue 
                placeholder="Sélectionnez une tâche" 
                className="text-base"
              />
            </SelectTrigger>
            <SelectContent>
              {teams?.length > 0 && teams.map((item) => (
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

