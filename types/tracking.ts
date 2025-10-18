export interface TrackingData {
  Pedido: number
  QEPTA: number
  CNPJ?: string
  'Data de Envio': string  // Mantém como string dd/MM/yyyy
  'Previsao de Entrega': string  // Mantém como string dd/MM/yyyy
  'Data de Entrega'?: string  // Mantém como string dd/MM/yyyy
  'Nota Fiscal': number
  Cidade: string
  Estado: string
  Transportadora: string
  'Valor do Produto': string
  'Valor do Transporte'?: string
  Quantidade: number
  'Tipo do Produto': string
  Modelo: string
  Cliente: string
  'Comprovante URL'?: string
  'Tempo de Entrega'?: number | null
  'Status Totem'?: string
  'Numero Serie'?: string
  'Nome Fantasia'?: string
}
