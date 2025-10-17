import { toast } from "sonner";


export function flushError(error:unknown, defaultMessage:string = "Something went wrong!"){
    if (error instanceof Error) {
        toast.error(error.message)
        return
    }
    
    if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as any).message === 'string'
    ) {
        toast.error((error as { message: string }).message);
        return
    }

    toast.error(defaultMessage)
}