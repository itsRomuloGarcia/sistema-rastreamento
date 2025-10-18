'use client'

import { useQuery } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { TrackingData } from '@/types/tracking'
import { parse, parseISO, isValid, differenceInDays } from 'date-fns'

const SHEET_URL_IFOOD = process.env.NEXT_PUBLIC_SHEET_URL_IFOOD || 'https://docs.google.com/spreadsheets/d/1A8rNGt2e0mxk124nN9sjkyvaek0O1kNmS-Pd8naggpM/edit?usp=sharing'

// Interface específica para iFood
export interface TrackingDataIfood extends TrackingData {
  'Comprovante URL'?: string
  'Tempo de Entrega'?: number | null
}

// Interface para os dados brutos da planilha
interface SheetRowIfood {
  'Sênior'?: string | number
  'Qepta'?: string | number
  'CNPJ'?: string
  'Data real de Saída'?: string
  'Data real da Previsão de Entrega'?: string
  'Data Real de Entrega totem (executada)'?: string
  'NF do Totem'?: string | number
  'Quantidade'?: string | number
  'Modelo do totem'?: string
  'Cidade'?: string
  'Estado'?: string
  'Transportadora'?: string
  'Razão Social'?: string
  'Nome Fantasia'?: string
  'Comprovante de entrega'?: string
  'NÃO EXCLUIR'?: string
  'NÃO EXCLUIR '?: string
  'NAO EXCLUIR'?: string
  [key: string]: any // Para outras colunas não mapeadas
}

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

function calculateDeliveryTime(startDate: string, endDate?: string): number | undefined {
  const start = parseDate(startDate)
  if (!start) return undefined

  const end = endDate ? parseDate(endDate) : new Date()
  if (!end) return undefined

  // Calcula diferença em dias usando horário local
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
  
  const diffTime = endMidnight - startMidnight
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays >= 0 ? diffDays : undefined
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

// Mapeamento EXATO para a planilha iFood
const validateAndCleanDataIfood = (rawData: any[]): TrackingDataIfood[] => {
  if (!Array.isArray(rawData)) {
    console.warn('Dados iFood não são um array:', rawData)
    return []
  }

  return rawData
    .filter((item: any) => {
      if (!item || typeof item !== 'object') return false
      const hasCNPJ = item['CNPJ'] && String(item['CNPJ']).trim() !== ''
      return hasCNPJ
    })
    .map((item: any) => {
      try {
        const cnpjClean = item['CNPJ'] ? String(item['CNPJ']).replace(/\D/g, '') : ''
        
        const pedidoQepta = item['Qepta'] && String(item['Qepta']).trim() !== '' 
          ? Number(String(item['Qepta']).trim()) 
          : 0

        // BUSCA COMPROVANTE NA COLUNA BN (NÃO EXCLUIR)
        let comprovanteUrl = ''
        
        // Tenta diferentes nomes possíveis para a coluna BN
        const possiveisNomes = ['NÃO EXCLUIR', 'NÃO EXCLUIR ', 'NAO EXCLUIR']
        
        for (const nomeColuna of possiveisNomes) {
          if (item[nomeColuna] && String(item[nomeColuna]).trim().startsWith('http')) {
            const link = String(item[nomeColuna]).trim()
            comprovanteUrl = link.replace('/view?', '/preview?')
            console.log('✅ Link do comprovante encontrado:', comprovanteUrl)
            break
          }
        }
        
        // Se não encontrou com os nomes padrão, busca qualquer coluna que comece com "NÃO"
        if (!comprovanteUrl) {
          const colunas = Object.keys(item as object)
          const colunaBN = colunas.find(col => col.startsWith('NÃO') || col.startsWith('NAO'))
          if (colunaBN && item[colunaBN] && String(item[colunaBN]).trim().startsWith('http')) {
            const link = String(item[colunaBN]).trim()
            comprovanteUrl = link.replace('/view?', '/preview?')
            console.log('✅ Link encontrado na coluna:', colunaBN, comprovanteUrl)
          }
        }

        const tempoEntrega = calculateDeliveryTime(
          item['Data real de Saída'] || '',
          item['Data Real de Entrega totem (executada)'] || ''
        )

        const result: TrackingDataIfood = {
          Pedido: pedidoQepta,
          QEPTA: pedidoQepta,
          CNPJ: cnpjClean,
          'Data de Envio': item['Data real de Saída'] ? String(item['Data real de Saída']).trim() : 'N/A',
          'Previsao de Entrega': item['Data real da Previsão de Entrega'] ? String(item['Data real da Previsão de Entrega']).trim() : 'N/A',
          'Data de Entrega': item['Data Real de Entrega totem (executada)'] ? String(item['Data Real de Entrega totem (executada)']).trim() : undefined,
          'Nota Fiscal': item['NF do Totem'] ? Number(String(item['NF do Totem']).trim()) || 0 : 0,
          Quantidade: item['Quantidade'] ? Number(item['Quantidade']) || 1 : 1,
          'Tipo do Produto': item['Modelo do totem'] ? String(item['Modelo do totem']).trim() : 'N/A',
          Modelo: item['Modelo do totem'] ? String(item['Modelo do totem']).trim() : 'N/A',
          Cidade: item['Cidade'] ? String(item['Cidade']).trim() : 'N/A',
          Estado: item['Estado'] ? String(item['Estado']).trim() : 'N/A',
          Transportadora: item['Transportadora'] ? String(item['Transportadora']).trim() : 'N/A',
          Cliente: item['Razão Social'] ? String(item['Razão Social']).trim() : 'N/A',
          'Valor do Produto': 'N/A',
          'Valor do Transporte': 'N/A',
          'Comprovante URL': comprovanteUrl,
          'Tempo de Entrega': tempoEntrega,
          'Nome Fantasia': item['Nome Fantasia'] ? String(item['Nome Fantasia']).trim() : 'N/A'
        }

        return result

      } catch (error) {
        console.warn('❌ Erro ao processar item iFood:', item, error)
        return null
      }
    })
    .filter((item): item is TrackingDataIfood => item !== null)
}

export function useSheetDataIfood() {
  return useQuery({
    queryKey: ['sheet-data-ifood'],
    queryFn: async (): Promise<TrackingDataIfood[]> => {
      try {
        if (!SHEET_URL_IFOOD) {
          throw new Error('URL da planilha iFood não configurada')
        }

        console.log('🔄 Buscando dados da planilha iFood...')

        const exportUrl = SHEET_URL_IFOOD
          .replace('/edit', '/export')
          .replace('?usp=sharing', '')
          + '?format=csv&gid=541004446'

        const response = await fetch(exportUrl, {
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) {
          throw new Error(`Erro HTTP iFood: ${response.status}`)
        }

        const csvText = await response.text()

        if (!csvText || csvText.trim() === '') {
          throw new Error('Planilha iFood vazia')
        }

        const workbook = XLSX.read(csvText, { 
  type: 'string',
  raw: true,  // MUDANÇA: true ao invés de false
  cellDates: false,  // ADICIONE: não converte para Date automaticamente
  dateNF: 'dd/mm/yyyy'
})

const sheetName = workbook.SheetNames.find(name => 
  name.toLowerCase().includes('ifood')
) || workbook.SheetNames[0]

const worksheet = workbook.Sheets[sheetName]
const rawData = XLSX.utils.sheet_to_json(worksheet, {
  raw: true,  // MUDANÇA: true ao invés de false
  defval: '',
  dateNF: 'dd/mm/yyyy'
}) as SheetRowIfood[]

        // DEBUG: Mostrar colunas disponíveis
        if (rawData.length > 0) {
          console.log('🔍 COLUNAS DISPONÍVEIS:', Object.keys(rawData[0]))
        }

        const cleanData = validateAndCleanDataIfood(rawData)
        console.log('✅ Dados iFood processados:', cleanData.length, 'registros')

        return cleanData

      } catch (error) {
        console.error('❌ Erro ao buscar dados iFood:', error)
        throw error
      }
      
    },
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 2,
  })
}

export function useTrackingSearchCPF(query: string) {
  const { data: allData, ...rest } = useSheetDataIfood()

  const trackingData = allData?.filter(item => {
    if (!item || !query) return false

    try {
      const cnpjItem = item.CNPJ || ''
      const queryClean = String(query).replace(/\D/g, '').trim()

      if (!queryClean) return false

      return cnpjItem === queryClean
    } catch (error) {
      console.warn('Erro na busca iFood:', error)
      return false
    }
  }) || []

  return {
    data: trackingData,
    ...rest
  }
}