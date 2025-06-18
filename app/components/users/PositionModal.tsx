import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { IUser } from '~/core/entities/user.entity.server'
import { IPosition } from '~/core/entities/position.entity.server'
import { useFetcher } from '@remix-run/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
interface PositionModalProps {
  isOpen: boolean
  onClose: () => void
  user: IUser;
  positions?: IPosition[];
}

export function PositionModal({ isOpen, onClose, user, positions=[] }: PositionModalProps) {
  const [selectedPosition, setSelectedPosition] = useState<string>('')
  const fetcher = useFetcher();
  const [error, setError] = useState('')

  const handleSubmit = () => {
      const formData = new FormData();
      formData.append('_action','quickAssign')
      formData.append("user", user?.id as string);
      formData.append("position", selectedPosition as string);
      fetcher.submit(formData, { method: "POST", action: "/api/positions" });    
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
            Ajouter à une fiche de poste
          </DialogTitle>
        </DialogHeader>
  
        {error && (
          <div className="text-red-500 text-sm font-semibold py-4">{error}</div>
        )}
  
        <div className="py-4">
          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger className="w-full h-11">
              <SelectValue 
                placeholder="Sélectionnez une tâche" 
                className="text-base"
              />
            </SelectTrigger>
            <SelectContent>
              {positions?.length > 0 && positions.map((item) => (
                <SelectItem 
                  key={item.id} 
                  value={item.id as string}
                  className="text-base py-3"
                >
                  {item.title}
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

