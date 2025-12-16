import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function ConfirmButton() {
  return (
    <Button 
      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
    >
      <CheckCircle size={16} className="mr-2" />
      Confirm
    </Button>
  )
}
