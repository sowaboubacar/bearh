/* eslint-disable jsx-a11y/label-has-associated-control */
import { UploadIcon } from 'lucide-react'

interface FileUploadZoneProps {
  maxSize?: string
  multiple?: boolean
  accept?: string
  onFileSelect: (files: FileList) => void
  /**
   * Maximum number of files that can be uploaded
   */
  maxFilesNumber?: number

  disabled?: boolean
}

export function FileUploadZone({ maxSize = "2MB", multiple = false, accept, onFileSelect, maxFilesNumber=3 , disabled}: FileUploadZoneProps) {
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      console.log("files:", files)

      onFileSelect(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      console.log("files:", files)
      onFileSelect(files)
    }
  }
  return (
    <div
      className="cursor-pointer p-4 sm:p-8 lg:p-12 flex justify-center bg-white border border-dashed border-gray-300 rounded-xl dark:bg-neutral-800 dark:border-neutral-600"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <label className="w-full cursor-pointer">
        <input
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
        />
        <div className="text-center">
          <span className="inline-flex justify-center items-center size-12 sm:size-14 lg:size-16 bg-gray-100 text-gray-800 rounded-full dark:bg-neutral-700 dark:text-neutral-200">
            <UploadIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
  
          <div className="mt-3 sm:mt-4 flex flex-wrap justify-center text-base sm:text-lg leading-relaxed text-gray-600">
            <span className="pe-1 font-medium text-gray-800 dark:text-neutral-200">
              Déposez vos fichier ici ou
            </span>
            <span className="bg-white font-semibold text-blue-600 hover:text-blue-700 rounded-lg decoration-2 hover:underline focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 dark:bg-neutral-800 dark:text-blue-500 dark:hover:text-blue-600">
              sélectionner un fichier
            </span>
          </div>
  
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-400 dark:text-neutral-400">
            Tailles de fichier max totale {maxSize}.
          </p>
        </div>
      </label>
    </div>
  )  
}


