'use client'

import { useQuery } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { TrackingData } from '@/types/tracking'
import { parse, parseISO, isValid, differenceInDays } from 'date-fns'

const SHEET_URL = process.env.NEXT_PUBLIC_SHEET_URL || ''

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return null

  try {
    // Tentar formato brasileiro dd/MM/yyyy
    const parsed = parse(dateStr.trim(), 'dd/MM/yyyy', new Date())
    if (isValid(parsed)) return parsed

    // Fallback para ISO
    const iso = parseISO(dateStr)
    if (isValid(iso)) return iso
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

  return differenceInDays(end, start)
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
    console.warn('Dados não são um array:', rawData)
    return []
  }

  return rawData
    .filter(item => {
      // Filtrar apenas itens válidos
      if (!item || typeof item !== 'object') return false

      // Deve ter pelo menos Pedido OU Nota Fiscal
      const hasPedido = item.Pedido && (typeof item.Pedido === 'number' || typeof item.Pedido === 'string')
      const hasNF = item['Nota Fiscal'] && (typeof item['Nota Fiscal'] === 'number' || typeof item['Nota Fiscal'] === 'string')

      return hasPedido || hasNF
    })
    .map(item => {
      try {
        return {
          Pedido: item.Pedido ? Number(item.Pedido) || 0 : 0,
          'Data de Envio': item['Data de Envio'] ? String(item['Data de Envio']).trim() : 'N/A',
          'Previsao de Entrega': item['Previsao de Entrega'] ? String(item['Previsao de Entrega']).trim() : 'N/A',
          'Data de Entrega': item['Data de Entrega'] ? String(item['Data de Entrega']).trim() : undefined,
          'Nota Fiscal': item['Nota Fiscal'] ? Number(item['Nota Fiscal']) || 0 : 0,
          Cidade: item.Cidade ? String(item.Cidade).trim() : 'N/A',
          Estado: item.Estado ? String(item.Estado).trim() : 'N/A',
          Transportadora: item.Transportadora ? String(item.Transportadora).trim() : 'N/A',
          'Valor do Produto': item['Valor do Produto'] ? String(item['Valor do Produto']).trim() : 'R$ 0,00',
          Quantidade: item.Quantidade ? Number(item.Quantidade) || 1 : 1,
          'Tipo do Produto': item['Tipo do Produto'] ? String(item['Tipo do Produto']).trim() : 'N/A',          
          Modelo: item.Modelo ? String(item.Modelo).trim() : 'N/A'
        }
      } catch (error) {
        console.warn('Erro ao processar item:', item, error)
        return null
      }
    })
    .filter(Boolean) as TrackingData[] // Remove nulls
}

export function useSheetData() {
  return useQuery({
    queryKey: ['sheet-data'],
    queryFn: async (): Promise<TrackingData[]> => {
      try {
        if (!SHEET_URL) {
          throw new Error('URL da planilha não configurada')
        }

        console.log('🔄 Buscando dados da planilha...')

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

        console.log('📄 CSV recebido, processando...')

        const workbook = XLSX.read(csvText, { 
          type: 'string',
          raw: false,
          dateNF: 'dd/mm/yyyy'
        })

        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          throw new Error('Nenhuma aba encontrada')
        }

        const worksheet = workbook.Sheets[sheetName]
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: ''
        })

        console.log('📊 Dados brutos:', rawData.length, 'linhas')

        if (!rawData || rawData.length === 0) {
          throw new Error('Nenhum dado encontrado')
        }

        const cleanData = validateAndCleanData(rawData)

        console.log('✅ Dados processados:', cleanData.length, 'registros válidos')

        return cleanData

      } catch (error) {
        console.error('❌ Erro ao buscar dados:', error)
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
      const pedido = String(item.Pedido || '').trim()
      const notaFiscal = String(item['Nota Fiscal'] || '').trim()
      const queryTrimmed = String(query).trim()

      if (!queryTrimmed) return false

      return pedido === queryTrimmed || 
             notaFiscal === queryTrimmed ||
             pedido.includes(queryTrimmed) ||
             notaFiscal.includes(queryTrimmed)
    } catch (error) {
      console.warn('Erro na busca:', error)
      return false
    }
  }) || null

  return {
    data: trackingData,
    ...rest
  }
}
