'use client'

import { TrackingData } from '@/types/tracking'
import { getTrackingStatus, calculateDays } from '@/hooks/use-tracking'
import { Package, MapPin, Truck, Calendar, Clock, DollarSign, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

interface TrackingResultProps {
  data: TrackingData
}

export function TrackingResult({ data }: TrackingResultProps) {
  const status = getTrackingStatus(data)
  const daysInTransit = calculateDays(data['Data de Envio'], data['Data de Entrega'])
  const daysUntilDelivery = data['Data de Entrega'] 
    ? null 
    : calculateDays(new Date().toISOString().split('T')[0], data['Previsao de Entrega'])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Status Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Pedido #{data.Pedido}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              NF {data['Nota Fiscal']} • {data['Tipo do Produto']} - {data.Modelo}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.bgColor}`}>
            {status.label}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data de Envio</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{data['Data de Envio']}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Previsão de Entrega</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{data['Previsao de Entrega']}</p>
            </div>
          </div>

          {data['Data de Entrega'] && (
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Data de Entrega</p>
                <p className="font-medium text-green-700 dark:text-green-400">{data['Data de Entrega']}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timing Info */}
      {(daysInTransit !== null || daysUntilDelivery !== null) && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Informações de Tempo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data['Data de Entrega'] && daysInTransit !== null && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Tempo de Entrega</p>
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    {daysInTransit} {daysInTransit === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              </div>
            )}

            {!data['Data de Entrega'] && daysUntilDelivery !== null && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                daysUntilDelivery < 0 
                  ? 'bg-red-50 dark:bg-red-900/30' 
                  : 'bg-blue-50 dark:bg-blue-900/30'
              }`}>
                <Clock className={`w-5 h-5 ${
                  daysUntilDelivery < 0 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
                <div>
                  <p className={`text-sm ${
                    daysUntilDelivery < 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {daysUntilDelivery < 0 ? 'Atrasado há' : 'Faltam'}
                  </p>
                  <p className={`font-semibold ${
                    daysUntilDelivery < 0 
                      ? 'text-red-700 dark:text-red-300' 
                      : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    {Math.abs(daysUntilDelivery)} {Math.abs(daysUntilDelivery) === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipping Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Detalhes do Envio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Destino</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{data.Cidade}, {data.Estado}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transportadora</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{data.Transportadora}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quantidade</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {data.Quantidade} {data.Quantidade === 1 ? 'item' : 'itens'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valores</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{data['Valor do Produto']}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Frete: {data['Valor do Transporte']}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}