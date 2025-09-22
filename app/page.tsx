'use client'

import { useState } from 'react'
import { useTrackingSearch } from '@/hooks/use-tracking'
import { Search, Package } from 'lucide-react'
import { TrackingResult } from '@/components/tracking-result'
import { ThemeToggle } from '@/components/theme-toggle'
import { motion, AnimatePresence } from 'framer-motion'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: tracking, isLoading, error } = useTrackingSearch(searchTerm)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length >= 1) {
      setSearchTerm(query.trim())
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Sistema de Rastreamento
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Search Form */}
        <div className="card mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número do Pedido ou Nota Fiscal
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Digite o número do pedido ou nota fiscal..."
                  className="input-field pl-10"
                  autoComplete="off"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={query.trim().length < 1}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Consultar
            </button>
          </form>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card text-center py-8"
            >
              <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Consultando...</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
            >
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <Package className="w-5 h-5" />
                <p>Erro ao consultar. Tente novamente.</p>
              </div>
            </motion.div>
          )}

          {searchTerm && !isLoading && !error && !tracking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
            >
              <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                <Package className="w-5 h-5" />
                <p>Pedido não encontrado. Verifique o número e tente novamente.</p>
              </div>
            </motion.div>
          )}

          {tracking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TrackingResult data={tracking} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        {!searchTerm && (
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Como usar</h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Digite o número do pedido ou da nota fiscal no campo acima e clique em "Consultar" 
                  para acompanhar o status da entrega.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 – Rômulo Garcia ·{' '}
            <a 
              href="https://linkedin.com/in/itsromulogarcia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              LinkedIn
            </a>
            {' '}·{' '}
            <a 
              href="https://github.com/itsromulogarcia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}