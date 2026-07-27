import {defineField} from 'sanity'

export const videoCaptionsField = () =>
  defineField({
    name: 'captions',
    title: 'Legendas do vídeo',
    description: 'Opcional. Carregue um ficheiro WebVTT (.vtt) para acessibilidade.',
    type: 'file',
    options: {accept: 'text/vtt,.vtt'},
  })
