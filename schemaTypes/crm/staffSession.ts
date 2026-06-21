import {defineField, defineType} from 'sanity'

// Server-managed login session for the /painel backend. Only a hash of the
// session token is stored, so a dataset leak cannot reveal usable sessions.
// Created/destroyed by the server; not meant to be edited by hand.
export const staffSession = defineType({
  name: 'staffSession',
  title: 'Sessão de equipa',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({name: 'tokenHash', title: 'Hash do token', type: 'string', hidden: true}),
    defineField({
      name: 'user',
      title: 'Conta',
      type: 'reference',
      to: [{type: 'staffUser'}],
    }),
    defineField({name: 'createdAt', title: 'Criada em', type: 'datetime'}),
    defineField({name: 'expiresAt', title: 'Expira em', type: 'datetime'}),
    defineField({name: 'ipHash', title: 'Hash do IP', type: 'string', hidden: true}),
    defineField({name: 'userAgent', title: 'Navegador', type: 'string'}),
  ],
  preview: {
    select: {user: 'user.name', expiresAt: 'expiresAt'},
    prepare({user, expiresAt}) {
      const date = expiresAt ? new Date(expiresAt).toLocaleString('pt-PT') : 'sem validade'
      return {title: user || 'Sessão', subtitle: `expira ${date}`}
    },
  },
})
