'use client'

import { useQuery } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { TrackingData } from '@/types/tracking'

const SHEET_URL = process.env.NEXT_PUBLIC_SHEET_URL || ''

function parseDate(dateStr: string | number): Date | null {
  if (!dateStr || dateStr === 'N/A' || (typeof dateStr === 'string' && dateStr.trim() === '')) return null

  try {
    // Se for número (serial date do Excel)
    if (typeof dateStr === 'number') {
      // Converte serial date do Excel para data JavaScript
      const excelEpoch = new Date(1899, 11, 30) // 30 de dezembro de 1899
      const date = new Date(excelEpoch.getTime() + dateStr * 86400000)
      return date
    }

    // Se for string no formato dd/mm/yyyy
    const dateString = String(dateStr).trim()
    const [day, month, year] = dateString.split('/').map(Number)
    
    // Valida os valores
    if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12) {
      return null
    }
    
    // Cria a data às 12h para evitar problemas de timezone
    const parsed = new Date(year, month - 1, day, 12, 0, 0, 0)
    
    // Verificação rigorosa
    if (parsed.getDate() === day && 
        parsed.getMonth() === month - 1 && 
        parsed.getFullYear() === year) {
      return parsed
    }
    
  } catch (error) {
    console.warn('Erro ao fazer parse da data:', dateStr, error)
  }

  return null
}

export function calculateDays(startDate: string, endDate?: string): number | null {
  const start = parseDate(startDate)
  if (!start) return null

  const end = endDate ? parseDate(endDate) : new Date()
  if (!end) return null

  // Calcula diferença em dias usando horário local
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
  
  const diffTime = endMidnight - startMidnight
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export function getTrackingStatus(data: TrackingData) {
  const today = new Date()
  const deliveryDate = data['Data de Entrega'] ? parseDate(data['Data de Entrega']) : null
  const expectedDate = parseDate(data['Previsao de Entrega'])

  if (deliveryDate) {
    return {
      status: 'delivered' as const,
      label: 'Entregue',
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    }
  }

  if (expectedDate && today > expectedDate) {
    return {
      status: 'delayed' as const,
      label: 'Atrasado',
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    }
  }

  const shippingDate = parseDate(data['Data de Envio'])
  if (shippingDate) {
    return {
      status: 'shipped' as const,
      label: 'Em Trânsito',
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    }
  }

  return {
    status: 'pending' as const,
    label: 'Processando',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  }
}

// VALIDAÇÃO REFORÇADA - evita erros nas linhas
const validateAndCleanData = (rawData: any[]): TrackingData[] => {
  if (!Array.isArray(rawData)) {
    return []
  }

  return rawData
    .filter(item => {
      if (!item || typeof item !== 'object') return false
      return (item['Sênior'] || item['QEPTA'] || item['NF.'])
    })
    .map(item => {
      try {
        const pedidoSenior = item['Sênior'] && String(item['Sênior']).trim() !== '' 
          ? Number(String(item['Sênior']).trim()) 
          : 0
        
        const pedidoQepta = item['QEPTA'] && String(item['QEPTA']).trim() !== '' 
          ? Number(String(item['QEPTA']).trim()) 
          : 0
        
        const pedidoFinal = pedidoSenior || pedidoQepta

        return {
          Pedido: pedidoFinal,
          QEPTA: pedidoQepta,
          'Data de Envio': item['Data de Envio'] ? String(item['Data de Envio']).trim() : 'N/A',
          'Previsao de Entrega': item['Prev. Entrega'] ? String(item['Prev. Entrega']).trim() : 'N/A',
          'Data de Entrega': item['Data Entrega'] ? String(item['Data Entrega']).trim() : undefined,
          'Nota Fiscal': item['NF.'] ? Number(String(item['NF.']).trim()) || 0 : 0,
          Cidade: item['Cidade'] ? String(item['Cidade']).trim() : 'N/A',
          Estado: item['UF'] ? String(item['UF']).trim() : 'N/A',
          Transportadora: item['Transportadora'] ? String(item['Transportadora']).trim() : 'N/A',
          'Valor do Produto': item['Valor NFe'] ? String(item['Valor NFe']).trim() : 'R$ 0,00',
          Quantidade: item['Quantidade'] ? Number(item['Quantidade']) || 1 : 1,
          'Tipo do Produto': item['Material'] ? String(item['Material']).trim() : 'N/A',
          Modelo: item['MODELO'] ? String(item['MODELO']).trim() : 'N/A',
          Cliente: item['Cliente'] ? String(item['Cliente']).trim() : 'N/A'
        }
      } catch {
        return null
      }
    })
    .filter(Boolean) as TrackingData[]
}

export function useSheetData() {
  return useQuery({
    queryKey: ['sheet-data'],
    queryFn: async (): Promise<TrackingData[]> => {
      try {
        if (!SHEET_URL) {
          throw new Error('URL da planilha não configurada')
        }

        const response = await fetch(SHEET_URL, {
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`)
        }

        const csvText = await response.text()

        if (!csvText || csvText.trim() === '') {
          throw new Error('Planilha vazia')
        }

        const workbook = XLSX.read(csvText, { 
          type: 'string',
          raw: true,  // MUDANÇA: true ao invés de false
          cellDates: false,  // ADICIONE: não converte para Date automaticamente
          dateNF: 'dd/mm/yyyy'
        })

        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          throw new Error('Nenhuma aba encontrada')
        }

        const worksheet = workbook.Sheets[sheetName]
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          raw: true,  // MUDANÇA: true ao invés de false
          defval: '',
          dateNF: 'dd/mm/yyyy'
        })

        if (!rawData || rawData.length === 0) {
          throw new Error('Nenhum dado encontrado')
        }

        return validateAndCleanData(rawData)

      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        throw error
      }
    },
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 2,
  })
}

export function useTrackingSearch(query: string) {
  const { data: allData, ...rest } = useSheetData()

  const trackingData = allData?.find(item => {
    if (!item || !query) return false

    try {
      const pedidoSenior = String(item.Pedido || '').trim()
      const pedidoQepta = String(item.QEPTA || '').trim()
      const notaFiscal = String(item['Nota Fiscal'] || '').trim()
      const queryTrimmed = String(query).trim()

      if (!queryTrimmed) return false

      return pedidoSenior === queryTrimmed || 
             pedidoQepta === queryTrimmed ||
             notaFiscal === queryTrimmed

    } catch {
      return false
    }
  }) || null

  return {
    data: trackingData,
    ...rest
  }
}
