export interface TrackingData {
  Pedido: number
  'Data de Envio': string
  'Previsao de Entrega': string
  'Data de Entrega'?: string
  'Nota Fiscal': number
  Cidade: string
  Estado: string
  Transportadora: string
  'Valor do Produto': string
  Quantidade: number
  'Tipo do Produto': string
  'Valor do Transporte': string
  Modelo: string
}

export interface TrackingStatus {
  status: 'pending' | 'shipped' | 'delivered' | 'delayed'
  label: string
  color: string
  bgColor: string
}