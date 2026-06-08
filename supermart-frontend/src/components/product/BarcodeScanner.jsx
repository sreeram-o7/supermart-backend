import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { X, Camera } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader()
    readerRef.current = codeReader

    codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
      if (result && scanning) {
        setScanning(false)
        onScan(result.getText())
      }
      if (err && err.name !== 'NotFoundException') {
        setError('Camera access denied. Please allow camera permission.')
      }
    }).catch(() => {
      setError('Could not access camera. Please check permissions.')
    })

    return () => {
      codeReader.reset()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Camera size={20} className="text-primary-500" />
            <h3 className="font-semibold text-gray-900">Scan Barcode</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative aspect-square bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
          />

          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-primary-400 rounded-lg relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br" />
              {scanning && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-primary-500 animate-bounce" />
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="p-4 text-center">
          {error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : scanning ? (
            <p className="text-gray-500 text-sm">Point camera at a barcode</p>
          ) : (
            <p className="text-green-600 text-sm font-medium">Barcode detected!</p>
          )}
        </div>
      </div>
    </div>
  )
}