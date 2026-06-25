import { useState, useRef } from 'react'
import { Upload, Download, X, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import Button from '../ui/Button'
import { adminApi } from '../../api/admin.api'
import toast from 'react-hot-toast'

export default function BulkImportModal({ onClose }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (file) => {
    if (!file) return
    const validTypes = ['.csv', '.xlsx', '.xls']
    const isValid = validTypes.some(ext => file.name.toLowerCase().endsWith(ext))
    if (!isValid) {
      toast.error('Please upload a CSV or Excel file.')
      return
    }
    setSelectedFile(file)
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await adminApi.downloadImportTemplate()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'product_import_template.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error('Failed to download template.')
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first.')
      return
    }
    setImporting(true)
    try {
      const response = await adminApi.bulkImportProducts(selectedFile)
      setResult(response.data.data)
      queryClient.invalidateQueries(['admin-products'])
      toast.success(response.data.message)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setSelectedFile(null)
    setResult(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-screen overflow-y-auto">

        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">Bulk Import Products</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Step 1 — Download template */}
          {!result && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Step 1: Download the template
              </p>
              <p className="text-xs text-blue-600 mb-3">
                Fill in your product details using the same column format.
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Download size={14} />
                Download CSV Template
              </button>
            </div>
          )}

          {/* Step 2 — Upload file */}
          {!result && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Step 2: Upload your file
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet size={32} className="text-green-500" />
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={32} className="text-gray-300" />
                    <p className="text-sm text-gray-500">
                      Drag and drop or click to upload
                    </p>
                    <p className="text-xs text-gray-400">CSV, XLSX, or XLS</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={20} />
                <p className="font-semibold">Import Complete</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.created}</p>
                  <p className="text-xs text-green-700">Created</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                  <p className="text-xs text-blue-700">Updated</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">{result.skipped}</p>
                  <p className="text-xs text-orange-700">Skipped</p>
                </div>
              </div>

              {result.skipped_details?.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-orange-500" />
                    <p className="text-sm font-medium text-orange-800">
                      Skipped Rows
                    </p>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.skipped_details.map((item, i) => (
                      <p key={i} className="text-xs text-orange-700">
                        Row {item.row}: {item.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                Processed {result.total_rows_processed} rows total
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3 justify-end">
          {result ? (
            <>
              <Button variant="secondary" onClick={reset}>
                Import Another File
              </Button>
              <Button onClick={onClose}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                loading={importing}
                disabled={!selectedFile}
                onClick={handleImport}
              >
                Import Products
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}