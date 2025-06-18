import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

interface BonusModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function BonusModal({ isOpen, onClose, userId }: BonusModalProps) {
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusReason, setBonusReason] = useState('')

  const handleSubmit = () => {
    // Here you would typically submit the bonus information
    console.log(`Submitting bonus for user ${userId}: Amount: ${bonusAmount}, Reason: ${bonusReason}`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Attribuer une prime additionnelle
          </DialogTitle>
        </DialogHeader>
  
        <div className="space-y-6 py-4">
          <div className="flex flex-col sm:grid sm:grid-cols-4 gap-3 sm:items-center">
            <Label 
              htmlFor="amount" 
              className="text-base sm:text-right"
            >
              Montant
            </Label>
            <div className="sm:col-span-3">
              <Input
                id="amount"
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                className="h-11 text-base"
              />
            </div>
          </div>
  
          <div className="flex flex-col sm:grid sm:grid-cols-4 gap-3 sm:items-center">
            <Label 
              htmlFor="reason" 
              className="text-base sm:text-right"
            >
              Raison
            </Label>
            <div className="sm:col-span-3">
              <Input
                id="reason"
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                className="h-11 text-base"
              />
            </div>
          </div>
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
            Attribuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );  
}