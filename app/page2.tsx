'use client'

import { useState } from 'react'
import { useTrackingSearchCPF } from '@/hooks/use-tracking-cpf'
import { Search, Package, ArrowLeft, Download, Truck, Clock, ArrowRight, User } from 'lucide-react'
import { TrackingResult } from '@/components/tracking-result'
import { ThemeToggle } from '@/components/theme-toggle'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function RastreioIfoodPage() {
  const [query, setQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: trackingResults, isLoading, error } = useTrackingSearchCPF(searchTerm)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanQuery = query.replace(/\D/g, '')
    
    // Validação: CPF (11 dígitos) ou CNPJ (14 dígitos)
    if (cleanQuery.length === 11 || cleanQuery.length === 14) {
      setSearchTerm(cleanQuery)
    }
  }

  // Função para formatar CPF/CNPJ durante a digitação
  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 11) {
      // Formata CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    } else {
      // Formata CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value)
    setQuery(formatted)
  }

  // Verifica se é um CPF/CNPJ válido para habilitar o botão
  const isValidDocument = () => {
    const cleanQuery = query.replace(/\D/g, '')
    return cleanQuery.length === 11 || cleanQuery.length === 14
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-red-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                
              </Link>
              <div className="relative">
                <div className="absolute -inset-1 bg-[#ea1d2c]/20 rounded-lg blur-sm"></div>
                <Truck className="relative w-8 h-8 text-[#ea1d2c]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-[#ea1d2c] dark:from-gray-100 dark:to-[#ea1d2c] bg-clip-text text-transparent">
                  Rastreio iFood
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Rastreador <span className="text-[#ea1d2c]"></span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Digite o CPF ou CNPJ do cliente para consultar todos os pedidos iFood
            </p>
          </motion.div>
        </div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl mb-8"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                CPF ou CNPJ do Cliente
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder="Digite CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)"
                  className="input-field pl-12 pr-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 focus:border-[#ea1d2c] transition-colors"
                  autoComplete="off"
                  autoFocus
                  maxLength={18}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {query.length === 0 ? 'Digite um CPF ou CNPJ válido' : 
                 query.replace(/\D/g, '').length === 11 ? '✅ CPF válido' : 
                 query.replace(/\D/g, '').length === 14 ? '✅ CNPJ válido' : 
                 '❌ Documento inválido - CPF precisa de 11 dígitos, CNPJ de 14'}
              </p>
            </div>
            
            <button
              type="submit"
              disabled={!isValidDocument()}
              className="btn-primary bg-gradient-to-r from-[#ea1d2c] to-[#d01827] hover:from-[#d01827] hover:to-[#b81522] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 py-3 text-lg font-semibold transition-all hover:scale-105 w-full"
            >
              <Search className="w-5 h-5" />
              Consultar iFood
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Botão Voltar Integrado */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
  <div className="flex items-center justify-center gap-4">
    <span className="text-gray-500 dark:text-gray-400 text-sm"></span>
    <Link 
      href="/"
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFA000] to-[#ea1d2c] hover:from-[#FDB913] hover:to-[#FFA000] text-white rounded-lg font-medium transition-all hover:scale-105 shadow-lg"
    >
      <Truck className="w-4 h-4" />
      Rastreio Videosoft
    </Link>
  </div>
</div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="animate-spin w-12 h-12 border-4 border-[#ea1d2c]/20 border-t-[#ea1d2c] rounded-full"></div>
                  <Clock className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#ea1d2c]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Consultando iFood...
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Buscando pedidos associados ao documento
                </p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">
                    Erro na consulta iFood
                  </h4>
                  <p className="text-red-700 dark:text-red-400 text-sm">
                    Não foi possível buscar os pedidos iFood. Tente novamente.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {searchTerm && !isLoading && !error && trackingResults && trackingResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header com total de resultados */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-3 bg-[#ea1d2c]/10 px-4 py-2 rounded-full">
                  <div className="w-8 h-8 bg-[#ea1d2c] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{trackingResults.length}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {trackingResults.length === 1 ? '1 pedido encontrado' : `${trackingResults.length} pedidos encontrados`}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Documento: {query}
                </p>
              </div>

              {/* Lista de resultados */}
              <div className="space-y-6">
                {trackingResults.map((tracking, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Badge de número do pedido */}
                    <div className="absolute -top-3 -left-3 bg-gradient-to-r from-[#ea1d2c] to-[#d01827] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg z-10">
                      Pedido {index + 1}
                    </div>
                    
                    {/* Comprovante de download se disponível */}
                    {tracking['Comprovante URL'] && (
                      <div className="absolute -top-3 -right-3">
                        <a
                          href={tracking['Comprovante URL']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gradient-to-r from-[#ea1d2c] to-[#d01827] hover:from-[#d01827] hover:to-[#b81522] text-white px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          Comprovante
                        </a>
                      </div>
                    )}
                    
                    <TrackingResult data={tracking} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {searchTerm && !isLoading && !error && (!trackingResults || trackingResults.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card border-orange-300 dark:border-orange-700 bg-orange-50/80 dark:bg-orange-900/20 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                  <Search className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-orange-800 dark:text-orange-300">
                    Nenhum pedido encontrado
                  </h4>
                  <p className="text-orange-700 dark:text-orange-400 text-sm">
                    Não foram encontrados pedidos iFood para este CPF/CNPJ.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Section 
        {!searchTerm && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6 mt-12"
          >
            <div className="card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#ea1d2c]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-[#ea1d2c]" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Busca por Documento
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Encontre todos os pedidos usando CPF ou CNPJ do cliente
              </p>
            </div>

            <div className="card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#ea1d2c]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-[#ea1d2c]" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Comprovantes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Acesso direto aos comprovantes de entrega quando disponíveis
              </p>
            </div>

            <div className="card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#ea1d2c]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-6 h-6 text-[#ea1d2c]" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Especializado iFood
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Interface otimizada para pedidos da plataforma iFood
              </p>
            </div>
          </motion.div>
        )}
          */}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 transition-colors mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-[#ea1d2c]" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 · {' '}
              <a 
                href="https://linkedin.com/in/itsromulogarcia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
              >
                LinkedIn
              </a>
              {' '}·{' '}
              <a 
                href="https://github.com/itsromulogarcia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
